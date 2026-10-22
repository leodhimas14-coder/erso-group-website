const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { HttpError } = require('../middleware/errorHandler');
const { normalizePhone } = require('../services/order.service');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "login" can be an email or an Albanian mobile number. */
function parseLogin(value) {
  const raw = String(value || '').trim();
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) throw new HttpError(400, 'Email-i nuk është i saktë');
    return { email };
  }
  const phone = normalizePhone(raw);
  if (!phone) throw new HttpError(400, 'Shkruaj një email ose një numër telefoni të saktë (p.sh. 069 123 4567)');
  return { phone };
}

function checkPassword(password) {
  if (String(password || '').length < 6) throw new HttpError(400, 'Fjalëkalimi duhet të ketë të paktën 6 shenja');
  if (String(password).length > 200) throw new HttpError(400, 'Fjalëkalimi është shumë i gjatë');
}

const sign = (c) => jwt.sign({ type: 'customer', id: c._id, name: c.name }, process.env.JWT_SECRET, { expiresIn: '90d' });

async function register(req, res) {
  const name = String(req.body?.name || '').trim().slice(0, 100);
  if (!name) throw new HttpError(400, 'Shkruaj emrin');
  const login = parseLogin(req.body?.login);
  checkPassword(req.body?.password);

  if (await Customer.exists(login)) {
    throw new HttpError(409, login.email ? 'Ky email ka tashmë llogari. Hyr me të.' : 'Ky numër ka tashmë llogari. Hyr me të.');
  }
  const customer = await Customer.create({ name, ...login, passwordHash: await bcrypt.hash(String(req.body.password), 10) });
  res.status(201).json({ token: sign(customer), customer });
}

async function login(req, res) {
  const login = parseLogin(req.body?.login);
  const customer = await Customer.findOne({ ...login, active: true });
  const ok = customer && (await bcrypt.compare(String(req.body?.password || ''), customer.passwordHash));
  if (!ok) throw new HttpError(401, 'Email/numri ose fjalëkalimi është i gabuar');
  res.json({ token: sign(customer), customer });
}

async function me(req, res) {
  const customer = await Customer.findById(req.customer.id);
  if (!customer || !customer.active) throw new HttpError(401, 'Llogaria nuk ekziston');
  res.json({ customer });
}

async function updateMe(req, res) {
  const customer = await Customer.findById(req.customer.id);
  if (!customer || !customer.active) throw new HttpError(401, 'Llogaria nuk ekziston');
  const body = req.body || {};
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 100);
    if (!name) throw new HttpError(400, 'Emri nuk mund të jetë bosh');
    customer.name = name;
  }
  // Adding the missing contact (email or phone) to the account.
  if (body.email !== undefined && String(body.email).trim()) {
    const { email } = parseLogin(String(body.email));
    if (!email) throw new HttpError(400, 'Email-i nuk është i saktë');
    if (await Customer.exists({ email, _id: { $ne: customer._id } })) throw new HttpError(409, 'Ky email përdoret nga një llogari tjetër');
    customer.email = email;
  }
  if (body.phone !== undefined && String(body.phone).trim()) {
    const phone = normalizePhone(body.phone);
    if (!phone) throw new HttpError(400, 'Numri i telefonit nuk është i saktë');
    if (await Customer.exists({ phone, _id: { $ne: customer._id } })) throw new HttpError(409, 'Ky numër përdoret nga një llogari tjetër');
    customer.phone = phone;
  }
  if (body.newPassword) {
    if (!(await bcrypt.compare(String(body.currentPassword || ''), customer.passwordHash))) throw new HttpError(400, 'Fjalëkalimi aktual është i gabuar');
    checkPassword(body.newPassword);
    customer.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
  }
  await customer.save();
  res.json({ customer });
}

async function myOrders(req, res) {
  const orders = await Order.find({ customerId: req.customer.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ orders: orders.map((o) => ({ ...o.toTracking(), phone: o.customer.phone })) });
}

// ---- Admin ----

async function adminList(req, res) {
  const filter = {};
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 }).limit(500);
  const counts = await Order.aggregate([
    { $match: { customerId: { $in: customers.map((c) => c._id) }, status: { $ne: 'pa_paguar' } } },
    { $group: { _id: '$customerId', orders: { $sum: 1 }, spent: { $sum: { $cond: ['$paid', '$total', 0] } } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    customers: customers.map((c) => ({ ...c.toJSON(), orders: byId[c._id]?.orders || 0, spent: byId[c._id]?.spent || 0 })),
  });
}

async function adminUpdate(req, res) {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new HttpError(404, 'Klienti nuk u gjet');
  if (req.body?.active !== undefined) customer.active = Boolean(req.body.active);
  if (req.body?.password) {
    checkPassword(req.body.password);
    customer.passwordHash = await bcrypt.hash(String(req.body.password), 10);
  }
  await customer.save();
  res.json({ customer });
}

module.exports = { register, login, me, updateMe, myOrders, adminList, adminUpdate };
