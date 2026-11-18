const express = require('express');
const rateLimit = require('express-rate-limit');
const { asyncHandler: h } = require('../middleware/errorHandler');
const { requireAuth, requireCustomer, requireRole } = require('../middleware/auth');
const auth = require('../controllers/auth.controller');
const shop = require('../controllers/shop.controller');
const products = require('../controllers/products.controller');
const orders = require('../controllers/orders.controller');
const shipments = require('../controllers/shipments.controller');
const reports = require('../controllers/reports.controller');
const settings = require('../controllers/settings.controller');
const newsletter = require('../controllers/newsletter.controller');
const uploads = require('../controllers/uploads.controller');
const categories = require('../controllers/categories.controller');
const customers = require('../controllers/customers.controller');

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Shumë kërkesa, provoni pas pak minutash' },
  });

const router = express.Router();

// Public shop
router.get('/config', h(shop.config));
router.get('/products', h(shop.listProducts));
router.get('/products/:slug', h(shop.getProduct));
router.get('/categories', h(categories.publicList));
router.post('/orders', limiter(20), requireCustomer, h(shop.placeOrder));

// Shopper accounts
router.post('/customers/register', limiter(10), h(customers.register));
router.post('/customers/login', limiter(20), h(customers.login));
router.get('/customers/me', requireCustomer, h(customers.me));
router.put('/customers/me', limiter(30), requireCustomer, h(customers.updateMe));
router.get('/customers/me/orders', requireCustomer, h(customers.myOrders));
router.post('/payments/:provider/callback', limiter(60), h(shop.paymentCallback));
router.get('/orders/track/:number', limiter(60), h(shop.trackOrder));
router.post('/newsletter', limiter(10), h(newsletter.subscribe));

// Staff
router.post('/auth/login', limiter(10), h(auth.login));
router.get('/auth/me', requireAuth, h(auth.me));

const admin = express.Router();
admin.use(requireAuth);

const adminOnly = requireRole('admin');
admin.get('/products', adminOnly, h(products.list));
admin.get('/products/:id', adminOnly, h(products.get));
admin.post('/products', adminOnly, h(products.create));
admin.put('/products/:id', adminOnly, h(products.update));
admin.delete('/products/:id', adminOnly, h(products.remove));

admin.get('/orders', h(orders.list));
admin.get('/orders/:id', h(orders.get));
admin.patch('/orders/:id', h(orders.update));
admin.get('/purchase-list', h(orders.purchaseList));
admin.post('/purchase-list/mark-bought', h(orders.markPurchased));

admin.get('/shipments', h(shipments.list));
admin.get('/shipments/:id', h(shipments.get));
admin.post('/shipments', h(shipments.create));
admin.patch('/shipments/:id', h(shipments.update));
admin.post('/shipments/:id/orders', h(shipments.addOrders));
admin.delete('/shipments/:id/orders/:orderId', h(shipments.removeOrder));

admin.get('/reports/summary', adminOnly, h(reports.summary));

admin.get('/settings', adminOnly, h(settings.get));
admin.put('/settings', adminOnly, h(settings.update));
admin.get('/subscribers', adminOnly, h(newsletter.list));

admin.get('/categories', adminOnly, h(categories.adminList));
admin.post('/categories', adminOnly, h(categories.create));
admin.patch('/categories/:id', adminOnly, h(categories.update));
admin.post('/categories/:id/move', adminOnly, h(categories.move));
admin.delete('/categories/:id', adminOnly, h(categories.remove));

admin.get('/customers', adminOnly, h(customers.adminList));
admin.patch('/customers/:id', adminOnly, h(customers.adminUpdate));
admin.post('/uploads', adminOnly, uploads.receiveFiles, h(uploads.upload));

router.use('/admin', admin);

module.exports = router;
