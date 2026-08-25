const Order = require('../models/Order');
const Product = require('../models/Product');
const { createPaymentIntent } = require('../services/stripe.service');
const { issueFiscalReceipt } = require('../services/fiscalization.service');
const { deductForOrder } = require('../services/inventory.service');
const { emitOrderCreated, emitOrderUpdated } = require('../sockets/index');

const TAX_RATE = 0.2; // Albanian standard VAT; move to config if it varies by product

async function nextOrderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Order.countDocuments({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });
  return `${today}-${String(countToday + 1).padStart(4, '0')}`;
}

/** Creates a pending order from a cart, computing prices server-side from the current product catalog. */
async function createOrder(req, res, next) {
  try {
    const { channel, items, customerName } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
    const productsById = new Map(products.map((p) => [String(p._id), p]));

    const resolvedItems = items.map((requested) => {
      const product = productsById.get(requested.productId);
      if (!product || !product.available) {
        throw Object.assign(new Error(`Product unavailable: ${requested.productId}`), { status: 400 });
      }

      const options = (requested.selectedOptions || []).map(({ groupName, choiceName }) => {
        const group = product.optionGroups.find((g) => g.name === groupName);
        const choice = group?.choices.find((c) => c.name === choiceName);
        if (!choice) {
          throw Object.assign(new Error(`Invalid option: ${groupName} / ${choiceName}`), { status: 400 });
        }
        return { groupName, choiceName, priceDelta: choice.priceDelta };
      });

      const unitPrice = product.basePrice + options.reduce((sum, o) => sum + o.priceDelta, 0);

      return {
        product: product._id,
        nameSnapshot: product.name,
        quantity: requested.quantity || 1,
        unitPrice,
        options,
        notes: requested.notes || '',
      };
    });

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order = await Order.create({
      orderNumber: await nextOrderNumber(),
      channel,
      items: resolvedItems,
      subtotal,
      tax,
      total,
      customerName,
      createdBy: req.user?.id,
    });

    emitOrderCreated(order);
    return res.status(201).json({ order });
  } catch (err) {
    return next(err);
  }
}

/** Creates a Stripe PaymentIntent for an existing pending order. */
async function createPaymentForOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: `Order is not awaiting payment (status: ${order.status})` });
    }

    const intent = await createPaymentIntent({ amount: order.total, orderId: order._id.toString() });
    order.payment.stripePaymentIntentId = intent.id;
    await order.save();

    return res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    return next(err);
  }
}

/**
 * Shared "payment confirmed" pipeline: flips status, deducts inventory, and
 * fiscalizes. Used by both the cashier's mark-paid endpoint below and the
 * Stripe webhook handler (see routes/payments.routes.js), so the two paths
 * can never drift apart.
 */
async function markOrderPaidById(orderId, method) {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (order.status !== 'pending_payment') return order;

  order.status = 'paid';
  order.payment.method = method || order.payment.method;
  order.payment.paidAt = new Date();
  await order.save();

  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product) } });
  const productsById = new Map(products.map((p) => [String(p._id), p]));
  await deductForOrder(order, productsById);

  try {
    const { fiscalReceiptId, fiscalUrl } = await issueFiscalReceipt(order);
    order.fiscalization = { status: 'issued', fiscalReceiptId, fiscalUrl, issuedAt: new Date() };
  } catch (fiscalErr) {
    order.fiscalization = { status: 'failed', error: fiscalErr.message };
  }
  await order.save();

  emitOrderUpdated(order);
  return order;
}

/** HTTP entry point for the cashier's cash/terminal-payment confirmation flow. */
async function markOrderPaid(req, res, next) {
  try {
    const order = await markOrderPaidById(req.params.id, req.body.method);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}

/** Kitchen/cashier status transitions: preparing -> ready -> completed, or cancel. */
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    if (status === 'completed') order.completedAt = new Date();
    await order.save();

    emitOrderUpdated(order);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}

/** Kitchen display: updates a single line item's prep status without changing the whole order. */
async function updateOrderItemStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Order item not found' });
    item.status = status;

    if (order.items.every((i) => i.status === 'ready') && order.status === 'preparing') {
      order.status = 'ready';
    }
    await order.save();

    emitOrderUpdated(order);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status, channel, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createOrder,
  createPaymentForOrder,
  markOrderPaid,
  markOrderPaidById,
  updateOrderStatus,
  updateOrderItemStatus,
  listOrders,
  getOrder,
};
