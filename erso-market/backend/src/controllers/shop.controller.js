const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { HttpError } = require('../middleware/errorHandler');
const { createOrder, applyPaymentResult, normalizePhone } = require('../services/order.service');
const { getProvider, cardAvailable } = require('../services/payment.service');
const { GENDERS, ORDER_STATUSES } = require('../config/constants');
const { listCategories } = require('../services/category.service');
const { getShopSettings, publicSettings } = require('../services/settings.service');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function config(_req, res) {
  const s = publicSettings(await getShopSettings());
  if (!cardAvailable()) s.payments = { ...s.payments, card: false };
  res.json({
    ...s,
    // Kept for older app versions that read these top-level fields.
    shippingFee: s.shipping.fee,
    freeShippingFrom: s.shipping.freeFrom,
    categories: await listCategories(),
    genders: GENDERS,
    orderStatuses: ORDER_STATUSES,
  });
}

async function listProducts(req, res) {
  const filter = { active: true };
  const { category, gender, q, featured, sale, sort } = req.query;
  if (category) filter.category = String(category);
  if (gender) filter.gender = { $in: [String(gender), 'unisex'] };
  if (featured === '1') filter.featured = true;
  if (sale === '1') filter.$expr = { $gt: ['$compareAtPrice', '$price'] };
  if (q) filter.name = { $regex: escapeRegex(String(q).slice(0, 60)), $options: 'i' };

  const sortBy = { 'cmimi-ulet': { price: 1 }, 'cmimi-larte': { price: -1 } }[sort] || { createdAt: -1 };
  const limit = Math.min(Number(req.query.limit) || 48, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ products: products.map((p) => p.toPublic()), total, page, pages: Math.ceil(total / limit) });
}

async function getProduct(req, res) {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) throw new HttpError(404, 'Produkti nuk u gjet');
  res.json({ product: product.toPublic() });
}

async function placeOrder(req, res) {
  const { order, paymentUrl } = await createOrder(req.body, { customerId: req.customer.id });
  // Remember the delivery address for the next checkout.
  await Customer.updateOne({ _id: req.customer.id }, { $set: { address: { city: order.customer.city, address: order.customer.address } } });
  res.status(201).json({ order: order.toTracking(), paymentUrl });
}

// The provider's server tells us the result of a card payment.
async function paymentCallback(req, res) {
  const provider = getProvider();
  if (req.params.provider !== provider.name) throw new HttpError(404, 'Nuk u gjet');
  const result = provider.parseCallback(req);
  if (!result) throw new HttpError(400, 'Njoftim i pavlefshëm');
  const order = await applyPaymentResult(result.reference, result.paid);
  res.json({ order: order.toTracking() });
}

// The phone number acts as a password, so order numbers can't be enumerated.
async function trackOrder(req, res) {
  const phone = normalizePhone(req.query.phone);
  const number = String(req.params.number || '').toUpperCase().trim();
  const order = phone && (await Order.findOne({ number, 'customer.phone': phone }));
  if (!order) throw new HttpError(404, 'Porosia nuk u gjet. Kontrolloni numrin e porosisë dhe telefonin.');
  res.json({ order: order.toTracking() });
}

module.exports = { config, listProducts, getProduct, placeOrder, paymentCallback, trackOrder };
