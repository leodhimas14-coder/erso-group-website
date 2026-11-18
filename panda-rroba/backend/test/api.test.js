const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = require('path').join(require('os').tmpdir(), `panda-test-uploads-${process.pid}`);
process.env.JWT_SECRET = 'test-secret';
process.env.SHIPPING_FEE = '300';
process.env.FREE_SHIPPING_FROM = '6000';
process.env.CNY_TO_ALL = '13';

const { createApp } = require('../src/app');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const { expireUnpaidOrders } = require('../src/services/order.service');

let mongo;
let app;
let adminToken;
let staffToken;
let customerToken;
let jacket;
let wallet;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const passwordHash = await bcrypt.hash('sekret123', 4);
  await User.create({ name: 'Leo', email: 'admin@panda.al', passwordHash, role: 'admin' });
  await User.create({ name: 'Magazina', email: 'staff@panda.al', passwordHash, role: 'staff' });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@panda.al', password: 'sekret123' })).body.token;
  staffToken = (await request(app).post('/api/auth/login').send({ email: 'staff@panda.al', password: 'sekret123' })).body.token;
  customerToken = (await request(app).post('/api/customers/register').send({ name: 'Arta Hoxha', login: '069 123 4567', password: 'blerje123' })).body.token;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asStaff = (req) => req.set('Authorization', `Bearer ${staffToken}`);
const asCustomer = (req) => req.set('Authorization', `Bearer ${customerToken}`);
// Completes (or fails) the fake card payment the way the provider would.
async function pay(orderRes, success = true) {
  const ref = new URL(orderRes.body.paymentUrl).searchParams.get('ref');
  return request(app).post('/api/payments/test/callback').send({ reference: ref, success });
}

const customer = { name: 'Arta Hoxha', phone: '069 123 4567', city: 'Tiranë', address: 'Rr. Myslym Shyri 10' };

test('login rejects a wrong password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@panda.al', password: 'gabim' });
  assert.equal(res.status, 401);
});

test('admin creates products; staff cannot', async () => {
  const forbidden = await asStaff(request(app).post('/api/admin/products')).send({ name: 'X', category: 'rroba', price: 1 });
  assert.equal(forbidden.status, 403);

  let res = await asAdmin(request(app).post('/api/admin/products')).send({
    name: 'Xhaketë Lëkure',
    category: 'rroba',
    price: 5000,
    images: ['https://example.com/a.jpg'],
    variants: [{ size: 'M', color: 'E zezë', stock: 2 }, { size: 'L', color: 'E zezë', stock: 0 }],
    supplier: { name: 'Fabrika A', url: 'https://detail.1688.com/x', costCny: 120 },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.product.slug, 'xhakete-lekure');
  jacket = res.body.product;

  res = await asAdmin(request(app).post('/api/admin/products')).send({ name: 'Portofol', category: 'portofola', price: 1500 });
  assert.equal(res.status, 201);
  wallet = res.body.product;
});

test('public catalogue hides supplier details', async () => {
  const res = await request(app).get('/api/products?category=rroba');
  assert.equal(res.status, 200);
  assert.equal(res.body.products.length, 1);
  assert.equal(res.body.products[0].supplier, undefined);

  const one = await request(app).get('/api/products/xhakete-lekure');
  assert.equal(one.body.product.supplier, undefined);
  assert.equal(one.body.product.inStock, true);
});

test('menu filters: gender includes unisex, sale needs a lower price', async () => {
  await asAdmin(request(app).post('/api/admin/products')).send({ name: 'Çantë femrash', category: 'canta', gender: 'femra', price: 2000, compareAtPrice: 2500 });
  await asAdmin(request(app).post('/api/admin/products')).send({ name: 'Rrip meshkujsh', category: 'aksesore', gender: 'meshkuj', price: 900, compareAtPrice: 900 });

  const women = (await request(app).get('/api/products?gender=femra')).body.products.map((p) => p.name).sort();
  assert.deepEqual(women, ['Portofol', 'Xhaketë Lëkure', 'Çantë femrash'].sort(), 'unisex products appear for women too');

  const sale = (await request(app).get('/api/products?sale=1')).body.products.map((p) => p.name);
  assert.deepEqual(sale, ['Çantë femrash']);
});

test('checkout validates phone and variant', async () => {
  let res = await asCustomer(request(app).post('/api/orders')).send({ customer: { ...customer, phone: '12345' }, items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(res.status, 400);

  res = await asCustomer(request(app).post('/api/orders')).send({ customer, items: [{ productId: jacket._id, quantity: 1 }] });
  assert.equal(res.status, 400, 'variant is required when the product has variants');
});

let orderA;
let orderB;

test('order uses server prices, reserves local stock and charges shipping', async () => {
  const [m, l] = jacket.variants;
  const res = await asCustomer(request(app).post('/api/orders')).send({
    customer,
    items: [
      { productId: jacket._id, variantId: m._id, quantity: 1, unitPrice: 1 },
      { productId: jacket._id, variantId: l._id, quantity: 1 },
    ],
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.order.number, 'PA-1001');
  assert.equal(res.body.order.subtotal, 10000);
  assert.equal(res.body.order.shippingFee, 0, 'free shipping above 6000');
  assert.equal(res.body.order.status, 'pa_paguar', 'card orders wait for payment');
  assert.match(res.body.paymentUrl, /\/pagesa\?/);
  orderA = (await pay(res)).body.order;
  assert.equal(orderA.status, 'e_re');
  assert.equal(orderA.paid, true);

  const product = (await asAdmin(request(app).get(`/api/admin/products/${jacket._id}`))).body.product;
  assert.equal(product.variants[0].stock, 1, 'M stock reserved');

  const res2 = await asCustomer(request(app).post('/api/orders')).send({ customer: { ...customer, phone: '+355682223333' }, items: [{ productId: wallet._id, quantity: 2 }] });
  assert.equal(res2.body.order.total, 3300, '2×1500 + 300 shipping');
  orderB = (await pay(res2)).body.order;
});

test('tracking requires the matching phone number', async () => {
  let res = await request(app).get(`/api/orders/track/${orderA.number}?phone=0682223333`);
  assert.equal(res.status, 404);
  res = await request(app).get(`/api/orders/track/${orderA.number.toLowerCase()}?phone=0691234567`);
  assert.equal(res.status, 200);
  assert.equal(res.body.order.status, 'e_re');
  assert.equal(res.body.order.customer, undefined);
});

test('cancelling an order returns reserved stock', async () => {
  const [m] = jacket.variants;
  const placed = await asCustomer(request(app).post('/api/orders')).send({ customer, items: [{ productId: jacket._id, variantId: m._id, quantity: 1 }] });
  const list = await asStaff(request(app).get(`/api/admin/orders?q=${placed.body.order.number}`));
  const id = list.body.orders[0]._id;

  let product = (await asAdmin(request(app).get(`/api/admin/products/${jacket._id}`))).body.product;
  assert.equal(product.variants[0].stock, 0);

  const res = await asStaff(request(app).patch(`/api/admin/orders/${id}`)).send({ status: 'e_anuluar' });
  assert.equal(res.status, 200);
  product = (await asAdmin(request(app).get(`/api/admin/products/${jacket._id}`))).body.product;
  assert.equal(product.variants[0].stock, 1);

  const again = await asStaff(request(app).patch(`/api/admin/orders/${id}`)).send({ status: 'e_re' });
  assert.equal(again.status, 400, 'cancelled orders stay cancelled');
});

test('purchase list → bought → shipment → delivered → profit', async () => {
  const ids = {};
  for (const o of [orderA, orderB]) {
    const found = (await asStaff(request(app).get(`/api/admin/orders?q=${o.number}`))).body.orders[0];
    ids[o.number] = found._id;
    await asStaff(request(app).patch(`/api/admin/orders/${found._id}`)).send({ status: 'e_konfirmuar' });
  }

  const list = await asStaff(request(app).get('/api/admin/purchase-list'));
  assert.equal(list.status, 200);
  // Order A's M jacket came from Albania stock, so only the L jacket and the wallets are listed.
  const names = list.body.items.map((i) => `${i.name}|${i.size}|${i.quantity}`).sort();
  assert.deepEqual(names, ['Portofol||2', 'Xhaketë Lëkure|L|1']);
  assert.equal(list.body.items.find((i) => i.size === 'L').totalCny, 120);

  const bought = await asStaff(request(app).post('/api/admin/purchase-list/mark-bought')).send({ orderIds: Object.values(ids) });
  assert.equal(bought.body.updated, 2);

  const shipment = (await asStaff(request(app).post('/api/admin/shipments')).send({})).body.shipment;
  assert.match(shipment.code, /^CN-/);
  const added = await asStaff(request(app).post(`/api/admin/shipments/${shipment._id}/orders`)).send({ orderIds: Object.values(ids) });
  assert.equal(added.body.added, 2);

  await asStaff(request(app).patch(`/api/admin/shipments/${shipment._id}`)).send({ cargoCostAll: 1000, status: 'nisur' });
  let track = await request(app).get(`/api/orders/track/${orderB.number}?phone=0682223333`);
  assert.equal(track.body.order.status, 'ne_rruge');

  await asStaff(request(app).patch(`/api/admin/shipments/${shipment._id}`)).send({ status: 'mberritur' });
  track = await request(app).get(`/api/orders/track/${orderB.number}?phone=0682223333`);
  assert.equal(track.body.order.status, 'ne_shqiperi');

  await asStaff(request(app).patch(`/api/admin/orders/${ids[orderB.number]}`)).send({ status: 'e_dorezuar', costs: { purchaseCny: 36, deliveryAll: 200 } });

  const forbidden = await asStaff(request(app).get('/api/admin/reports/summary'));
  assert.equal(forbidden.status, 403);

  const report = await asAdmin(request(app).get('/api/admin/reports/summary'));
  assert.equal(report.body.delivered, 1);
  assert.equal(report.body.revenue, 3300);
  // 36 CNY × 13 = 468, + 500 cargo share + 200 delivery
  assert.equal(report.body.costs, 1168);
  assert.equal(report.body.profit, 2132);
});

test('home banner: empty by default, admin sets a video, staff cannot', async () => {
  let cfg = (await request(app).get('/api/config')).body;
  assert.equal(cfg.homeBanner.url, '');

  const bad = await asAdmin(request(app).put('/api/admin/settings')).send({ homeBanner: { url: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);

  const forbidden = await asStaff(request(app).put('/api/admin/settings')).send({ homeBanner: { url: 'https://cdn.example.com/a.mp4' } });
  assert.equal(forbidden.status, 403);

  const ok = await asAdmin(request(app).put('/api/admin/settings')).send({ homeBanner: { url: 'https://cdn.example.com/a.mp4', link: '/dyqani?oferta=1' } });
  assert.equal(ok.status, 200);
  cfg = (await request(app).get('/api/config')).body;
  assert.equal(cfg.homeBanner.url, 'https://cdn.example.com/a.mp4');
  assert.equal(cfg.homeBanner.link, '/dyqani?oferta=1');
});

test('newsletter: needs a valid email and consent, no duplicates', async () => {
  assert.equal((await request(app).post('/api/newsletter').send({ email: 'jo-email', consent: true })).status, 400);
  assert.equal((await request(app).post('/api/newsletter').send({ email: 'arta@gmail.com' })).status, 400);
  assert.equal((await request(app).post('/api/newsletter').send({ email: 'Arta@Gmail.com', consent: true })).status, 201);
  assert.equal((await request(app).post('/api/newsletter').send({ email: 'arta@gmail.com', consent: true })).status, 201);

  assert.equal((await asStaff(request(app).get('/api/admin/subscribers'))).status, 403);
  const list = await asAdmin(request(app).get('/api/admin/subscribers'));
  assert.deepEqual(list.body.subscribers.map((s) => s.email), ['arta@gmail.com']);
});

test('failed card payment cancels the order and returns the stock', async () => {
  const [m] = jacket.variants;
  const stockOf = async () => (await asAdmin(request(app).get(`/api/admin/products/${jacket._id}`))).body.product.variants[0].stock;
  const before = await stockOf();
  const res = await asCustomer(request(app).post('/api/orders')).send({ customer, items: [{ productId: jacket._id, variantId: m._id, quantity: 1 }] });
  assert.equal(await stockOf(), before - 1);

  const failed = await pay(res, false);
  assert.equal(failed.body.order.status, 'e_anuluar');
  assert.equal(await stockOf(), before);

  const again = await pay(res, true);
  assert.equal(again.body.order.status, 'e_anuluar', 'a late success does not revive a cancelled order');
});

test('unpaid card orders expire after the time limit', async () => {
  const res = await asCustomer(request(app).post('/api/orders')).send({ customer, items: [{ productId: wallet._id, quantity: 1 }] });
  await Order.collection.updateOne({ number: res.body.order.number }, { $set: { createdAt: new Date(Date.now() - 2 * 3600 * 1000) } });
  assert.ok((await expireUnpaidOrders(60)) >= 1);
  const track = await request(app).get(`/api/orders/track/${res.body.order.number}?phone=0691234567`);
  assert.equal(track.body.order.status, 'e_anuluar');
});

test('admin settings: shipping, payment methods, promo bar, contact', async () => {
  let res = await asAdmin(request(app).put('/api/admin/settings')).send({ payments: { card: false, cod: false } });
  assert.equal(res.status, 400, 'at least one payment method');

  res = await asAdmin(request(app).put('/api/admin/settings')).send({
    shipping: { fee: 400, freeFrom: 10000, localText: '1–2 ditë', chinaText: '12–20 ditë' },
    payments: { card: true, cod: true },
    promoBar: { enabled: true, text: 'Ulje 20% këtë javë' },
    contact: { whatsapp: '+355 69 123 4567', email: 'info@panda.al' },
    cnyToAll: 14,
  });
  assert.equal(res.status, 200);

  const cfg = (await request(app).get('/api/config')).body;
  assert.equal(cfg.promoBar.text, 'Ulje 20% këtë javë');
  assert.equal(cfg.shipping.fee, 400);
  assert.equal(cfg.contact.whatsapp, '355691234567');
  assert.equal(cfg.cnyToAll, undefined, 'exchange rate stays private');

  const cod = await asCustomer(request(app).post('/api/orders')).send({ customer, paymentMethod: 'cod', items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(cod.body.order.status, 'e_re', 'cash orders skip the payment step');
  assert.equal(cod.body.order.total, 1900, '1500 + new 400 shipping');
  assert.equal(cod.body.paymentUrl, null);

  // Back to card only, as the rest of the shop expects.
  await asAdmin(request(app).put('/api/admin/settings')).send({ payments: { card: true, cod: false }, shipping: { fee: 300, freeFrom: 6000 }, cnyToAll: 13 });
  const refused = await asCustomer(request(app).post('/api/orders')).send({ customer, paymentMethod: 'cod', items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(refused.status, 400);
});

test('uploads: admin only, real images and videos only, served back', async () => {
  const jpg = Buffer.concat([Buffer.from('ffd8ffe000104a464946', 'hex'), Buffer.alloc(200)]);
  const mp4 = Buffer.concat([Buffer.from('000000186674797069736f6d', 'hex'), Buffer.alloc(200)]);
  const html = Buffer.from('<script>alert(1)</script>');

  const staff = await asStaff(request(app).post('/api/admin/uploads')).attach('files', jpg, 'a.jpg');
  assert.equal(staff.status, 403);

  const fake = await asAdmin(request(app).post('/api/admin/uploads')).attach('files', html, 'photo.jpg');
  assert.equal(fake.status, 400, 'a renamed HTML file is refused');

  const ok = await asAdmin(request(app).post('/api/admin/uploads')).attach('files', jpg, 'a.jpg').attach('files', mp4, 'v.mp4');
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body.files.map((f) => f.kind), ['image', 'video']);
  assert.match(ok.body.files[0].url, /\/uploads\/[a-z0-9-]+\.jpg$/);

  const served = await request(app).get(new URL(ok.body.files[0].url).pathname);
  assert.equal(served.status, 200);
  assert.equal(served.headers['content-type'], 'image/jpeg');
});

test('bank account: IBAN is checked; bank transfer orders wait for payment', async () => {
  let res = await asAdmin(request(app).put('/api/admin/settings')).send({ payments: { card: true, bank: true } });
  assert.equal(res.status, 400, 'bank transfer needs an account first');

  res = await asAdmin(request(app).put('/api/admin/settings')).send({ bank: { holder: 'Panda shpk', iban: 'AL47 2121 1009 0000 0002 3569 8742' } });
  assert.equal(res.status, 400, 'wrong check digits');

  res = await asAdmin(request(app).put('/api/admin/settings')).send({ bank: { holder: 'Panda shpk', bankName: 'BKT', iban: 'al47 2121 1009 0000 0002 3569 8741', swift: 'ncbaaltx' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.settings.bank.iban, 'AL47212110090000000235698741');
  assert.equal(res.body.settings.bank.swift, 'NCBAALTX');

  assert.equal((await request(app).get('/api/config')).body.bank, undefined, 'account hidden while transfer is off');
  await asAdmin(request(app).put('/api/admin/settings')).send({ payments: { card: true, bank: true } });
  assert.equal((await request(app).get('/api/config')).body.bank.iban, 'AL47212110090000000235698741');

  const order = await asCustomer(request(app).post('/api/orders')).send({ customer, paymentMethod: 'bank', items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(order.status, 201);
  assert.equal(order.body.order.status, 'pa_paguar');
  assert.equal(order.body.paymentUrl, null);

  // Not expired after 2 hours (transfers take time), but after 4 days.
  await Order.collection.updateOne({ number: order.body.order.number }, { $set: { createdAt: new Date(Date.now() - 2 * 3600 * 1000) } });
  await expireUnpaidOrders(60, 72);
  const list = await asStaff(request(app).get(`/api/admin/orders?q=${order.body.order.number}`));
  assert.equal(list.body.orders[0].status, 'pa_paguar');

  // The owner sees the transfer and moves the order on: it counts as paid.
  const paid = await asStaff(request(app).patch(`/api/admin/orders/${list.body.orders[0]._id}`)).send({ status: 'e_re' });
  assert.equal(paid.body.order.paid, true);

  await asAdmin(request(app).put('/api/admin/settings')).send({ payments: { card: true, cod: false, bank: false } });
});

test('buying needs a customer account; browsing does not', async () => {
  assert.equal((await request(app).get('/api/products')).status, 200);
  const guest = await request(app).post('/api/orders').send({ customer, items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(guest.status, 401);
  assert.match(guest.body.error, /llogari/);
});

test('customer and staff logins never open each other\'s doors', async () => {
  assert.equal((await asCustomer(request(app).get('/api/admin/orders'))).status, 401, 'customer token on admin');
  const staffAsCustomer = await asStaff(request(app).post('/api/orders')).send({ customer, items: [{ productId: wallet._id, quantity: 1 }] });
  assert.equal(staffAsCustomer.status, 401, 'staff token on checkout');
});

test('customer accounts: email or phone, no duplicates, own orders only', async () => {
  let res = await request(app).post('/api/customers/register').send({ name: 'X', login: '0691234567', password: 'abcdef' });
  assert.equal(res.status, 409, 'phone already registered');
  res = await request(app).post('/api/customers/register').send({ name: 'Besa', login: 'besa@gmail.com', password: '123' });
  assert.equal(res.status, 400, 'short password');
  res = await request(app).post('/api/customers/register').send({ name: 'Besa', login: 'Besa@Gmail.com', password: 'abcdef' });
  assert.equal(res.status, 201);
  const besa = res.body.token;

  assert.equal((await request(app).post('/api/customers/login').send({ login: 'besa@gmail.com', password: 'gabim1' })).status, 401);
  const viaPhone = await request(app).post('/api/customers/login').send({ login: '+355 69 123 4567', password: 'blerje123' });
  assert.equal(viaPhone.status, 200);
  assert.equal(viaPhone.body.customer.passwordHash, undefined);

  const mine = await asCustomer(request(app).get('/api/customers/me/orders'));
  assert.ok(mine.body.orders.length >= 2, 'Arta sees her orders');
  const theirs = await request(app).get('/api/customers/me/orders').set('Authorization', `Bearer ${besa}`);
  assert.equal(theirs.body.orders.length, 0, 'Besa sees none of them');

  const me = await asCustomer(request(app).get('/api/customers/me'));
  assert.equal(me.body.customer.address.city, 'Tiranë', 'address remembered from the last order');

  const list = await asAdmin(request(app).get('/api/admin/customers'));
  assert.equal(list.status, 200);
  const arta = list.body.customers.find((c) => c.phone === '+355691234567');
  assert.ok(arta.orders >= 1);

  // Owner resets a forgotten password.
  await asAdmin(request(app).patch(`/api/admin/customers/${arta._id}`)).send({ password: 'iri12345' });
  assert.equal((await request(app).post('/api/customers/login').send({ login: '0691234567', password: 'iri12345' })).status, 200);
});

test('categories: add, rename, hide, reorder; delete only when empty', async () => {
  let res = await asAdmin(request(app).post('/api/admin/categories')).send({ label: 'Syze dielli', emoji: '🕶️' });
  assert.equal(res.status, 201);
  assert.equal(res.body.category.key, 'syze-dielli');
  const id = res.body.category._id;
  assert.equal((await asStaff(request(app).post('/api/admin/categories')).send({ label: 'X' })).status, 403);

  const prod = await asAdmin(request(app).post('/api/admin/products')).send({ name: 'Syze Aviator', category: 'syze-dielli', price: 1200 });
  assert.equal(prod.status, 201);
  assert.equal((await asAdmin(request(app).post('/api/admin/products')).send({ name: 'Y', category: 'nuk-ekziston', price: 1 })).status, 400);

  await asAdmin(request(app).patch(`/api/admin/categories/${id}`)).send({ label: 'Syze' });
  await asAdmin(request(app).post(`/api/admin/categories/${id}/move`)).send({ direction: 'up' });
  let pub = (await request(app).get('/api/config')).body.categories.map((c) => c.label);
  assert.equal(pub.at(-2), 'Syze', 'moved up one place, renamed');

  assert.equal((await asAdmin(request(app).delete(`/api/admin/categories/${id}`))).status, 400, 'has a product');
  assert.equal((await asAdmin(request(app).delete(`/api/admin/products/${prod.body.product._id}`))).status, 200);
  assert.equal((await asAdmin(request(app).get(`/api/admin/products/${prod.body.product._id}`))).status, 404, 'deleted for good');

  await asAdmin(request(app).patch(`/api/admin/categories/${id}`)).send({ active: false });
  pub = (await request(app).get('/api/categories')).body.categories.map((c) => c.key);
  assert.ok(!pub.includes('syze-dielli'), 'hidden from the shop');
  assert.equal((await asAdmin(request(app).delete(`/api/admin/categories/${id}`))).status, 200);
});

test('page texts and home titles are editable', async () => {
  await asAdmin(request(app).put('/api/admin/settings')).send({ pages: { about: '## Kush jemi\nNjë dyqan i vogël.', info: '', terms: '' }, home: { featuredTitle: 'Zgjedhjet tona' } });
  const cfg = (await request(app).get('/api/config')).body;
  assert.equal(cfg.pages.about, '## Kush jemi\nNjë dyqan i vogël.');
  assert.equal(cfg.home.featuredTitle, 'Zgjedhjet tona');
  assert.equal(cfg.home.latestTitle, 'Të rejat', 'empty falls back to the default');
});

test('admin routes need a token', async () => {
  const res = await request(app).get('/api/admin/orders');
  assert.equal(res.status, 401);
});
