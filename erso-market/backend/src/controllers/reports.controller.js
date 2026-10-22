const Order = require('../models/Order');
const { getShopSettings } = require('../services/settings.service');

/**
 * Sales and profit for a date range (default: current month). Profit only
 * counts delivered orders, because cash-on-delivery money isn't real until then.
 */
async function summary(req, res) {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to) : now;
  const { cnyToAll } = await getShopSettings();

  // Card checkouts that were never paid are not sales (cancelled or still waiting).
  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
    $nor: [{ paymentMethod: { $in: ['card', 'bank'] }, paid: false, status: { $in: ['pa_paguar', 'e_anuluar'] } }],
  });
  const delivered = orders.filter((o) => o.status === 'e_dorezuar');
  const active = orders.filter((o) => !['e_dorezuar', 'e_anuluar'].includes(o.status));

  const costOf = (o) => Math.round(o.costs.purchaseCny * cnyToAll) + o.costs.cargoAll + o.costs.deliveryAll;
  const revenue = delivered.reduce((s, o) => s + o.total, 0);
  const costs = delivered.reduce((s, o) => s + costOf(o), 0);

  const byStatus = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  const topMap = new Map();
  for (const o of orders.filter((x) => x.status !== 'e_anuluar')) {
    for (const i of o.items) {
      const row = topMap.get(String(i.product)) || { name: i.name, quantity: 0, revenue: 0 };
      row.quantity += i.quantity;
      row.revenue += i.quantity * i.unitPrice;
      topMap.set(String(i.product), row);
    }
  }

  res.json({
    from,
    to,
    cnyToAll,
    orders: orders.length,
    delivered: delivered.length,
    cancelled: byStatus.e_anuluar || 0,
    revenue,
    costs,
    profit: revenue - costs,
    pendingValue: active.reduce((s, o) => s + o.total, 0),
    byStatus,
    topProducts: [...topMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
  });
}

module.exports = { summary };
