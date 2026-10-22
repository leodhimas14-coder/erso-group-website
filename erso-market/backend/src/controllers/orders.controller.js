const mongoose = require('mongoose');
const Order = require('../models/Order');
const { HttpError } = require('../middleware/errorHandler');
const { setOrderStatus } = require('../services/order.service');
const { ORDER_STATUSES, keys } = require('../config/constants');
const { getShopSettings } = require('../services/settings.service');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function list(req, res) {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.q) {
    const rx = { $regex: escapeRegex(String(req.query.q).slice(0, 60)), $options: 'i' };
    filter.$or = [{ number: rx }, { 'customer.name': rx }, { 'customer.phone': rx }, { 'customer.city': rx }];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300);
  const counts = await Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  res.json({ orders, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
}

async function get(req, res) {
  const order = await Order.findById(req.params.id).populate('shipment', 'code status');
  if (!order) throw new HttpError(404, 'Porosia nuk u gjet');
  res.json({ order });
}

async function update(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Porosia nuk u gjet');
  const body = req.body || {};

  if (body.costs) {
    for (const key of ['purchaseCny', 'cargoAll', 'deliveryAll']) {
      if (body.costs[key] !== undefined) order.costs[key] = Number(body.costs[key]) || 0;
    }
  }
  for (const key of ['courierTracking', 'internalNote']) {
    if (body[key] !== undefined) order[key] = String(body[key]);
  }
  if (body.paid !== undefined) order.paid = Boolean(body.paid);
  await order.save();

  if (body.status !== undefined) {
    if (!keys(ORDER_STATUSES).includes(body.status)) throw new HttpError(400, 'Status i pavlefshëm');
    // Moving a waiting order on by hand means the money arrived (e.g. a bank transfer).
    if (order.status === 'pa_paguar' && body.status !== 'e_anuluar') {
      order.paid = true;
      order.payment.paidAt = new Date();
    }
    await setOrderStatus(order, body.status, req.user.name, String(body.note || ''));
  }
  res.json({ order });
}

/**
 * Shopping list for the China side: everything in confirmed orders that isn't
 * covered by Albania stock, grouped by product + size + colour, with the
 * supplier link and expected cost.
 */
async function purchaseList(_req, res) {
  const rows = await Order.aggregate([
    { $match: { status: 'e_konfirmuar' } },
    { $unwind: '$items' },
    { $match: { 'items.fromLocalStock': false } },
    {
      $group: {
        _id: { product: '$items.product', size: '$items.size', color: '$items.color' },
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        quantity: { $sum: '$items.quantity' },
        orders: { $addToSet: { id: '$_id', number: '$number' } },
      },
    },
    { $lookup: { from: 'products', localField: '_id.product', foreignField: '_id', as: 'product' } },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    { $sort: { name: 1 } },
  ]);

  const { cnyToAll } = await getShopSettings();
  res.json({
    cnyToAll,
    items: rows.map((r) => ({
      productId: r._id.product,
      name: r.name,
      image: r.image,
      size: r._id.size,
      color: r._id.color,
      quantity: r.quantity,
      orders: r.orders,
      supplier: r.product?.supplier || {},
      totalCny: (r.product?.supplier?.costCny || 0) * r.quantity,
    })),
  });
}

/** Marks every confirmed order in the list as bought from the supplier. */
async function markPurchased(req, res) {
  const ids = (Array.isArray(req.body?.orderIds) ? req.body.orderIds : []).filter((id) => mongoose.isValidObjectId(id));
  const orders = await Order.find({ _id: { $in: ids }, status: 'e_konfirmuar' });
  for (const order of orders) await setOrderStatus(order, 'e_blere', req.user.name);
  res.json({ updated: orders.length });
}

module.exports = { list, get, update, purchaseList, markPurchased };
