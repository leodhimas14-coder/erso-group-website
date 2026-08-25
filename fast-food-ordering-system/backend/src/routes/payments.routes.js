const express = require('express');
const Order = require('../models/Order');
const { constructWebhookEvent } = require('../services/stripe.service');
const { markOrderPaidById } = require('../controllers/orders.controller');

const router = express.Router();

/**
 * Stripe webhook - must receive the raw request body for signature
 * verification, so this route is mounted with express.raw() in app.js
 * (before the global express.json() body parser).
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order = await Order.findOne({ 'payment.stripePaymentIntentId': intent.id });
    if (order) {
      await markOrderPaidById(order._id, 'stripe_card');
    }
  }

  return res.json({ received: true });
});

module.exports = router;
