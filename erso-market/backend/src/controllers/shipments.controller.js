const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { HttpError } = require('../middleware/errorHandler');
const { setOrderStatus } = require('../services/order.service');
const { SHIPMENT_STATUSES, SHIPMENT_TO_ORDER_STATUS, keys } = require('../config/constants');

// Orders that are physically in the China warehouse can be loaded into a shipment.
const LOADABLE = ['e_blere', 'ne_magazine'];

function defaultCode() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `CN-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

async function list(_req, res) {
  const shipments = await Shipment.find().sort({ createdAt: -1 }).limit(100).populate('orders', 'number customer.name customer.city status total');
  res.json({ shipments });
}

async function get(req, res) {
  const shipment = await Shipment.findById(req.params.id).populate('orders');
  if (!shipment) throw new HttpError(404, 'Dërgesa nuk u gjet');
  res.json({ shipment });
}

async function create(req, res) {
  const shipment = await Shipment.create({
    code: String(req.body?.code || '').trim() || defaultCode(),
    note: String(req.body?.note || ''),
  });
  res.status(201).json({ shipment });
}

// Splits the cargo bill evenly across the orders so each order's profit includes it.
async function spreadCargoCost(shipment) {
  if (shipment.orders.length === 0) return;
  const share = Math.round(shipment.cargoCostAll / shipment.orders.length);
  await Order.updateMany({ _id: { $in: shipment.orders } }, { $set: { 'costs.cargoAll': share } });
}

async function update(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new HttpError(404, 'Dërgesa nuk u gjet');
  const body = req.body || {};

  for (const key of ['weightKg', 'cargoCostAll']) {
    if (body[key] !== undefined) shipment[key] = Number(body[key]) || 0;
  }
  if (body.note !== undefined) shipment.note = String(body.note);

  if (body.status !== undefined && body.status !== shipment.status) {
    if (!keys(SHIPMENT_STATUSES).includes(body.status)) throw new HttpError(400, 'Status i pavlefshëm');
    shipment.status = body.status;
    if (body.status === 'nisur') shipment.departedAt = new Date();
    if (body.status === 'mberritur') shipment.arrivedAt = new Date();

    const orderStatus = SHIPMENT_TO_ORDER_STATUS[body.status];
    if (orderStatus) {
      const orders = await Order.find({ _id: { $in: shipment.orders }, status: { $ne: 'e_anuluar' } });
      for (const order of orders) await setOrderStatus(order, orderStatus, req.user.name, `Dërgesa ${shipment.code}`);
    }
  }

  await shipment.save();
  await spreadCargoCost(shipment);
  res.json({ shipment });
}

async function addOrders(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new HttpError(404, 'Dërgesa nuk u gjet');
  if (shipment.status !== 'ne_pergatitje') throw new HttpError(400, 'Dërgesa është nisur tashmë');

  const ids = (Array.isArray(req.body?.orderIds) ? req.body.orderIds : []).filter((id) => mongoose.isValidObjectId(id));
  const orders = await Order.find({ _id: { $in: ids }, status: { $in: LOADABLE }, shipment: null });
  for (const order of orders) {
    order.shipment = shipment._id;
    await setOrderStatus(order, 'ne_magazine', req.user.name);
    await order.save();
    shipment.orders.addToSet(order._id);
  }
  await shipment.save();
  await spreadCargoCost(shipment);
  res.json({ shipment, added: orders.length });
}

async function removeOrder(req, res) {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new HttpError(404, 'Dërgesa nuk u gjet');
  if (shipment.status !== 'ne_pergatitje') throw new HttpError(400, 'Dërgesa është nisur tashmë');

  shipment.orders.pull(req.params.orderId);
  await shipment.save();
  await Order.updateOne({ _id: req.params.orderId }, { $unset: { shipment: 1 }, $set: { 'costs.cargoAll': 0 } });
  await spreadCargoCost(shipment);
  res.json({ shipment });
}

module.exports = { list, get, create, update, addOrders, removeOrder, LOADABLE };
