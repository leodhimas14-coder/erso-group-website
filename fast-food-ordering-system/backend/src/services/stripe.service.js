const Stripe = require('stripe');

let stripeClient = null;
function getClient() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

/** Creates a PaymentIntent for an order total (amount in the smallest currency unit). */
async function createPaymentIntent({ amount, currency = 'eur', orderId, metadata = {} }) {
  const intent = await getClient().paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { orderId, ...metadata },
    automatic_payment_methods: { enabled: true },
  });
  return intent;
}

function constructWebhookEvent(rawBody, signature) {
  return getClient().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { createPaymentIntent, constructWebhookEvent };
