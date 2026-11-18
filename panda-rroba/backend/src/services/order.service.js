const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const { HttpError } = require('../middleware/errorHandler');
const { getShopSettings } = require('../services/settings.service');
const { getProvider } = require('./payment.service');
const { notifyOwner, formatNewOrder } = require('./notify.service');

const MAX_ITEMS = 30;
const MAX_QTY = 20;

// Albanian mobile numbers: 06X XXX XXXX, optionally with +355 / 00355 and no leading 0.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[\s\-().]/g, '');
  const match = digits.match(/^(?:\+355|00355|0)?(6[6-9]\d{7})$/);
  return match ? `+355${match[1]}` : null;
}

function requireText(value, label, max = 200) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(400, `${label} është i detyrueshëm`);
  if (text.length > max) throw new HttpError(400, `${label} është shumë i gjatë`);
  return text;
}

/**
 * Builds and saves an order from the shop checkout. Prices always come from the
 * database, never from the client. Items whose variant has Albania stock reserve
 * it immediately; the rest are bought in China.
 */
async function createOrder(input, { customerId } = {}) {
  const customer = {
    name: requireText(input?.customer?.name, 'Emri', 100),
    phone: normalizePhone(input?.customer?.phone),
    city: requireText(input?.customer?.city, 'Qyteti', 60),
    address: requireText(input?.customer?.address, 'Adresa', 300),
    note: String(input?.customer?.note ?? '').trim().slice(0, 500),
  };
  if (!customer.phone) throw new HttpError(400, 'Numri i telefonit nuk është i saktë (p.sh. 069 123 4567)');

  const rawItems = Array.isArray(input?.items) ? input.items : [];
  if (rawItems.length === 0) throw new HttpError(400, 'Shporta është bosh');
  if (rawItems.length > MAX_ITEMS) throw new HttpError(400, 'Shumë artikuj në një porosi');

  const shop = await getShopSettings();
  const paymentMethod = ['cod', 'bank'].includes(input?.paymentMethod) ? input.paymentMethod : 'card';
  if (!shop.payments[paymentMethod]) {
    const names = { cod: 'Pagesa në dorëzim', bank: 'Transferta bankare', card: 'Pagesa me kartë' };
    throw new HttpError(400, `${names[paymentMethod]} nuk pranohet`);
  }
  // Fail before touching stock if card payments can't be taken right now.
  const provider = paymentMethod === 'card' ? getProvider() : null;

  const reserved = []; // [{ productId, variantId, quantity }] to roll back on failure
  try {
    const items = [];
    for (const raw of rawItems) {
      const quantity = Number(raw?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
        throw new HttpError(400, 'Sasi e pavlefshme');
      }
      if (!mongoose.isValidObjectId(raw?.productId)) throw new HttpError(400, 'Produkt i pavlefshëm');

      const product = await Product.findOne({ _id: raw.productId, active: true });
      if (!product) throw new HttpError(400, 'Një nga produktet nuk është më në shitje');

      let variant = null;
      if (product.variants.length > 0) {
        variant = product.variants.id(raw?.variantId);
        if (!variant) throw new HttpError(400, `Zgjidhni masën/ngjyrën për "${product.name}"`);
      }

      let fromLocalStock = false;
      if (variant) {
        const res = await Product.updateOne(
          { _id: product._id, variants: { $elemMatch: { _id: variant._id, stock: { $gte: quantity } } } },
          { $inc: { 'variants.$.stock': -quantity } }
        );
        if (res.modifiedCount === 1) {
          fromLocalStock = true;
          reserved.push({ productId: product._id, variantId: variant._id, quantity });
        }
      }

      items.push({
        product: product._id,
        variantId: variant?._id,
        name: product.name,
        image: product.images[0] || '',
        size: variant?.size || '',
        color: variant?.color || '',
        quantity,
        unitPrice: product.price,
        fromLocalStock,
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const fee = shop.shipping.freeFrom > 0 && subtotal >= shop.shipping.freeFrom ? 0 : shop.shipping.fee;
    const seq = await Counter.next('order');

    // Card and bank-transfer orders stay out of the "new orders" list until paid.
    const status = paymentMethod === 'cod' ? 'e_re' : 'pa_paguar';
    const order = await Order.create({
      number: `PA-${seq}`,
      customerId,
      customer,
      items,
      subtotal,
      shippingFee: fee,
      total: subtotal + fee,
      paymentMethod,
      status,
      statusHistory: [{ status, by: 'klienti' }],
    });

    if (provider) {
      const { reference, redirectUrl } = await provider.createPayment(order);
      order.payment = { provider: provider.name, reference };
      await order.save();
      return { order, paymentUrl: redirectUrl };
    }
    notifyOwner(paymentMethod === 'bank' ? `${formatNewOrder(order)}\n⏳ Pret transfertën bankare` : formatNewOrder(order));
    return { order, paymentUrl: null };
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
}

async function restoreStock(entries) {
  for (const { productId, variantId, quantity } of entries) {
    await Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': quantity } }
    );
  }
}

/** Puts reserved Albania stock back when an order is cancelled. */
async function releaseOrderStock(order) {
  await restoreStock(
    order.items
      .filter((i) => i.fromLocalStock && i.variantId)
      .map((i) => ({ productId: i.product, variantId: i.variantId, quantity: i.quantity }))
  );
}

async function setOrderStatus(order, status, by, note = '') {
  if (order.status === status) return order;
  if (order.status === 'e_anuluar') throw new HttpError(400, 'Porosia e anuluar nuk mund të ndryshohet');
  if (status === 'e_anuluar') await releaseOrderStock(order);

  order.status = status;
  order.statusHistory.push({ status, by, note });
  if (status === 'e_dorezuar' && order.paymentMethod === 'cod') order.paid = true;
  return order.save();
}

/** Called when the payment provider confirms (or rejects) a card payment. */
async function applyPaymentResult(reference, paid) {
  const order = reference && (await Order.findOne({ 'payment.reference': reference }));
  if (!order) throw new HttpError(404, 'Pagesa nuk u gjet');
  if (order.paid || order.status !== 'pa_paguar') return order; // already handled

  if (paid) {
    order.paid = true;
    order.payment.paidAt = new Date();
    await setOrderStatus(order, 'e_re', 'pagesa', 'Paguar me kartë');
    notifyOwner(formatNewOrder(order));
  } else {
    await setOrderStatus(order, 'e_anuluar', 'pagesa', 'Pagesa me kartë nuk u krye');
  }
  return order;
}

/**
 * Cancels unpaid orders and puts their stock back: card checkouts after
 * `cardMinutes`, bank transfers (which take a day or two) after `bankHours`.
 */
async function expireUnpaidOrders(cardMinutes = 60, bankHours = 72) {
  const now = Date.now();
  const stale = await Order.find({
    status: 'pa_paguar',
    $or: [
      { paymentMethod: { $ne: 'bank' }, createdAt: { $lt: new Date(now - cardMinutes * 60 * 1000) } },
      { paymentMethod: 'bank', createdAt: { $lt: new Date(now - bankHours * 3600 * 1000) } },
    ],
  });
  for (const order of stale) await setOrderStatus(order, 'e_anuluar', 'sistemi', 'Pagesa nuk u krye në kohë');
  return stale.length;
}

module.exports = { createOrder, setOrderStatus, applyPaymentResult, expireUnpaidOrders, normalizePhone };
