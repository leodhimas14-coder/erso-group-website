const express = require('express');
const Order = require('../models/Order');
const { issueFiscalReceipt } = require('../services/fiscalization.service');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

/** Manual retry endpoint for orders whose automatic fiscalization failed. */
router.post('/:orderId/retry', requireAuth, requireRole('admin', 'cashier'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { fiscalReceiptId, fiscalUrl } = await issueFiscalReceipt(order);
    order.fiscalization = { status: 'issued', fiscalReceiptId, fiscalUrl, issuedAt: new Date() };
    await order.save();

    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
