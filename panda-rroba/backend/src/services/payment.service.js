// Card payments go through a hosted payment page: we create the payment,
// send the customer to the provider's page, and the provider tells us the
// result. Each provider implements:
//   createPayment(order)  -> { reference, redirectUrl }
//   parseCallback(req)    -> { reference, paid } | null   (for webhooks)
//
// PAYMENT_PROVIDER selects one:
//   test  - built-in fake card page for development and demos (never in production)
//   none  - card payment switched off until a real provider is connected
// A real provider (bank e-commerce, POK, Paysera, ...) is added as another
// entry below once the merchant account and its API documentation exist.

const crypto = require('crypto');
const { HttpError } = require('../middleware/errorHandler');

const clientUrl = () => (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const providers = {
  test: {
    name: 'test',
    async createPayment(order) {
      const reference = `test_${crypto.randomBytes(12).toString('hex')}`;
      const params = new URLSearchParams({ nr: order.number, ref: reference, provova: '1' });
      return { reference, redirectUrl: `${clientUrl()}/pagesa?${params}` };
    },
    parseCallback(req) {
      return { reference: String(req.body?.reference || ''), paid: req.body?.success === true };
    },
  },
};

function providerName() {
  const name = process.env.PAYMENT_PROVIDER || (process.env.NODE_ENV === 'production' ? 'none' : 'test');
  if (name === 'test' && process.env.NODE_ENV === 'production') return 'none';
  return name;
}

function getProvider() {
  const provider = providers[providerName()];
  if (!provider) throw new HttpError(503, 'Pagesa me kartë nuk është aktive ende. Provoni më vonë ose na kontaktoni.');
  return provider;
}

const cardAvailable = () => Boolean(providers[providerName()]);

module.exports = { getProvider, cardAvailable, providerName };
