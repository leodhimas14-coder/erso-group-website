// In-browser stand-in for the backend, used only by the demo build
// (`npm run build:demo`). It mirrors the real API routes closely enough to
// click through the whole shop and admin panel without a server. Data lives
// in this browser only.

const KEY = 'panda_demo_db_v7';
const DEFAULT_SETTINGS = {
  homeBanner: { url: '', posterUrl: '', link: '' },
  promoBar: { enabled: true, text: 'Transport falas mbi 6.000 L · Dërgesa në gjithë Shqipërinë' },
  shipping: { fee: 300, freeFrom: 6000, localText: '1–3 ditë pune', chinaText: '10–18 ditë' },
  payments: { card: true, cod: false, bank: false },
  home: { featuredTitle: 'Më të pëlqyerat', latestTitle: 'Të rejat', newsletterTitle: 'Regjistrohu dhe mëso të parën për ofertat dhe koleksionet e reja.' },
  pages: { about: '', info: '', terms: '' },
  bank: { holder: '', bankName: '', iban: '', swift: '' },
  contact: { whatsapp: '', phone: '', email: '' },
  cnyToAll: 13,
};
const S = () => {
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) if (db.settings[k] === undefined) db.settings[k] = clone(v);
  return db.settings;
};

const CATEGORIES = [
  { key: 'rroba', label: 'Rroba' }, { key: 'kepuce', label: 'Këpucë' }, { key: 'canta', label: 'Çanta' },
  { key: 'portofola', label: 'Portofola' }, { key: 'aksesore', label: 'Aksesorë' },
];
const GENDERS = [
  { key: 'femra', label: 'Femra' }, { key: 'meshkuj', label: 'Meshkuj' }, { key: 'femije', label: 'Fëmijë' }, { key: 'unisex', label: 'Unisex' },
];
const FLOW = ['e_re', 'e_konfirmuar', 'e_blere', 'ne_magazine', 'ne_rruge', 'ne_shqiperi', 'ne_dorezim', 'e_dorezuar'];

let uid = Date.now();
const id = () => (uid++).toString(16).padStart(24, '0');
const clone = (x) => JSON.parse(JSON.stringify(x));
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };

function art(emoji, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><text x="200" y="285" font-size="170" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seed() {
  const v = (list) => list.map((x) => ({ _id: id(), size: '', color: '', stock: 0, ...x }));
  const products = [
    { name: 'Xhaketë lëkure e zezë', gender: 'meshkuj', category: 'rroba', price: 4900, compareAtPrice: 6500, featured: true, images: [art('🧥', '#e9e4dc', '#cfc6b8')], description: 'Xhaketë me lëkurë artificiale, astar i butë, zinxhirë metalikë.', variants: v(['S', 'M', 'L', 'XL'].map((size) => ({ size, color: 'E zezë', stock: size === 'M' ? 3 : 0 }))), supplier: { name: 'Guangzhou Leather Co.', url: '', costCny: 120 } },
    { name: 'Atlete të bardha minimaliste', gender: 'unisex', category: 'kepuce', price: 3500, featured: true, images: [art('👟', '#e6eef0', '#c4d6db')], description: 'Atlete të lehta për çdo ditë, taban gome që nuk rrëshqet.', variants: v(['38', '39', '40', '41', '42', '43'].map((size) => ({ size, color: 'E bardhë' }))), supplier: { name: 'Putian Shoes', url: '', costCny: 75 } },
    { name: 'Çantë dore me zinxhir', gender: 'femra', category: 'canta', price: 2900, compareAtPrice: 3900, featured: true, images: [art('👜', '#f1e6e1', '#dcc3b8')], description: 'Çantë e vogël elegante, rrip zinxhiri që hiqet, xhep i brendshëm.', variants: v(['E zezë', 'Bezhë', 'E kuqe'].map((color) => ({ color, stock: 2 }))), supplier: { name: 'Baigou Bags', url: '', costCny: 48 } },
    { name: 'Portofol meshkujsh i hollë', gender: 'meshkuj', category: 'portofola', price: 1500, images: [art('👛', '#ece8f1', '#cfc6dc')], description: 'Portofol kompakt me 6 vende për karta dhe mbrojtje RFID.', variants: v(['E zezë', 'Kafe'].map((color) => ({ color, stock: 5 }))), supplier: { name: 'Baigou Bags', url: '', costCny: 18 } },
    { name: 'Bluzë me kapuç oversize', gender: 'unisex', category: 'rroba', price: 2600, featured: true, images: [art('👕', '#e3ebe4', '#bfd1c2')], description: 'Pambuk i trashë, prerje e gjerë, unisex.', variants: v(['S', 'M', 'L', 'XL'].flatMap((size) => ['Gri', 'E zezë'].map((color) => ({ size, color })))), supplier: { name: 'Hangzhou Knit', url: '', costCny: 55 } },
    { name: 'Kapele baseball', gender: 'unisex', category: 'aksesore', price: 900, images: [art('🧢', '#e8ecf3', '#c5cfe0')], description: 'Kapele pambuku me rregullim mbrapa.', variants: v(['E zezë', 'E bardhë', 'Blu'].map((color) => ({ color, stock: 4 }))), supplier: { name: 'Yiwu Caps', url: '', costCny: 9 } },
    { name: 'Çizme lëkure deri te kyçi', gender: 'femra', category: 'kepuce', price: 5200, images: [art('🥾', '#efe9e2', '#d6c8b6')], description: 'Çizme me taban të trashë, zinxhir anësor.', variants: v(['37', '38', '39', '40', '41'].map((size) => ({ size, color: 'Kafe' }))), supplier: { name: 'Putian Shoes', url: '', costCny: 130 } },
    { name: 'Çantë shpine urbane', gender: 'unisex', category: 'canta', price: 3200, images: [art('🎒', '#e5ebe9', '#c3d2cd')], description: 'Vend për laptop 15", material që nuk lag.', variants: v(['E zezë', 'Gri'].map((color) => ({ color }))), supplier: { name: 'Baigou Bags', url: '', costCny: 62 } },
    { name: 'Xhup fëmijësh me kapuç', gender: 'femije', category: 'rroba', price: 2400, compareAtPrice: 3000, images: [art('🧒', '#f0ebe0', '#dccfb4')], description: 'I ngrohtë dhe i lehtë, për 4–12 vjeç.', variants: v(['4-5', '6-7', '8-9', '10-12'].map((size) => ({ size, color: 'Blu' }))), supplier: { name: 'Huzhou Kids', url: '', costCny: 50 } },
    { name: 'Atlete fëmijësh me drita', gender: 'femije', category: 'kepuce', price: 1900, images: [art('👟', '#efe3ea', '#d9bfcc')], description: 'Taban që ndriçon kur ecin, mbyllje me ngjitës.', variants: v(['26', '28', '30', '32', '34'].map((size) => ({ size, color: 'Rozë' }))), supplier: { name: 'Putian Shoes', url: '', costCny: 38 } },
  ].map((p) => ({ _id: id(), slug: slugify(p.name), active: true, featured: false, compareAtPrice: undefined, createdAt: new Date().toISOString(), ...p }));

  const emoji = { rroba: '👕', kepuce: '👟', canta: '👜', portofola: '👛', aksesore: '🧢' };
  const categories = CATEGORIES.map((c, i) => ({ _id: id(), key: c.key, label: c.label, emoji: emoji[c.key] || '', image: '', position: i, active: true }));
  // A sample shopper so the admin's Klientët page isn't empty. Demo only: the password is kept as plain text in this browser.
  const customers = [{ _id: id(), name: 'Arbër Gjoka', phone: '+355693217788', password: 'demo123', address: { city: 'Shkodër', address: 'Rruga e Kavajës 45, kati 2' }, active: true, createdAt: new Date().toISOString() }];
  const db = { products, orders: [], shipments: [], seq: 1000, settings: clone(DEFAULT_SETTINGS), subscribers: [], categories, customers };
  const day = 86400000;
  const mk = (name, phone, city, lines, status, ago, extra = {}) => {
    const order = buildOrder(db, { customer: { name, phone, city, address: 'Rruga e Kavajës 45, kati 2', note: '' }, items: lines }, true);
    const steps = FLOW.slice(0, FLOW.indexOf(status) + 1);
    order.createdAt = new Date(Date.now() - ago * day).toISOString();
    order.statusHistory = steps.map((s, i) => ({ status: s, at: new Date(Date.now() - (ago - i * 0.6) * day).toISOString(), by: i ? 'Admin' : 'klienti', note: '' }));
    order.status = status;
    Object.assign(order, extra);
    return order;
  };
  const P = (i, vi = 0, q = 1) => ({ productId: products[i]._id, variantId: products[i].variants[vi]?._id, quantity: q });
  const o1 = mk('Elira Kola', '0682345678', 'Durrës', [P(1, 2), P(3, 1)], 'e_dorezuar', 9, { paid: true, costs: { purchaseCny: 93, cargoAll: 400, deliveryAll: 250 } });
  const o2 = mk('Besnik Shehu', '0695551122', 'Vlorë', [P(4, 3)], 'ne_rruge', 6);
  const o3 = mk('Klea Murati', '0674448899', 'Tiranë', [P(0, 2)], 'e_konfirmuar', 1);
  const o4 = mk('Arbër Gjoka', '0693217788', 'Shkodër', [P(6, 2), P(5, 0)], 'e_re', 0.2);
  o4.customerId = customers[0]._id;
  db.shipments.push({ _id: id(), code: 'CN-261010-A7K', status: 'nisur', orders: [o2._id], weightKg: 14, cargoCostAll: 4200, departedAt: new Date(Date.now() - 3 * day).toISOString(), note: '', createdAt: new Date(Date.now() - 4 * day).toISOString() });
  o2.shipment = db.shipments[0]._id;
  o2.costs.cargoAll = 4200;
  db.orders.push(o1, o2, o3, o4);
  return db;
}

function slugify(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizePhone(raw) {
  const m = String(raw || '').replace(/[\s\-().]/g, '').match(/^(?:\+355|00355|0)?(6[6-9]\d{7})$/);
  return m ? `+355${m[1]}` : null;
}

function buildOrder(db, input, seeding = false) {
  const c = input.customer || {};
  for (const [k, label] of [['name', 'Emri'], ['city', 'Qyteti'], ['address', 'Adresa']]) if (!String(c[k] || '').trim()) fail(400, `${label} është i detyrueshëm`);
  const phone = normalizePhone(c.phone);
  if (!phone) fail(400, 'Numri i telefonit nuk është i saktë (p.sh. 069 123 4567)');
  if (!input.items?.length) fail(400, 'Shporta është bosh');

  const items = input.items.map((raw) => {
    const p = db.products.find((x) => x._id === raw.productId && x.active);
    if (!p) fail(400, 'Një nga produktet nuk është më në shitje');
    const variant = p.variants.find((x) => x._id === raw.variantId);
    if (p.variants.length && !variant) fail(400, `Zgjidhni masën/ngjyrën për "${p.name}"`);
    let fromLocalStock = false;
    if (variant && variant.stock >= raw.quantity && !seeding) { variant.stock -= raw.quantity; fromLocalStock = true; }
    return { _id: id(), product: p._id, variantId: variant?._id, name: p.name, image: p.images[0] || '', size: variant?.size || '', color: variant?.color || '', quantity: raw.quantity, unitPrice: p.price, fromLocalStock };
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sh = (db.settings || DEFAULT_SETTINGS).shipping;
  const shippingFee = sh.freeFrom > 0 && subtotal >= sh.freeFrom ? 0 : sh.fee;
  const paymentMethod = seeding ? 'card' : ['cod', 'bank'].includes(input.paymentMethod) ? input.paymentMethod : 'card';
  const payments = (db.settings || DEFAULT_SETTINGS).payments;
  if (!seeding && !payments[paymentMethod]) fail(400, { cod: 'Pagesa në dorëzim', bank: 'Transferta bankare', card: 'Pagesa me kartë' }[paymentMethod] + ' nuk pranohet');
  const status = paymentMethod !== 'cod' && !seeding ? 'pa_paguar' : 'e_re';
  db.seq += 1;
  return {
    _id: id(), number: `PA-${db.seq}`, customer: { name: c.name.trim(), phone, city: c.city, address: c.address.trim(), note: String(c.note || '') },
    items, subtotal, shippingFee, total: subtotal + shippingFee, paymentMethod, paid: seeding, status,
    payment: { reference: paymentMethod === 'card' ? `test_${id()}` : '' },
    statusHistory: [{ status, at: new Date().toISOString(), by: 'klienti', note: '' }],
    costs: { purchaseCny: 0, cargoAll: 0, deliveryAll: 0 }, courierTracking: '', internalNote: '', createdAt: new Date().toISOString(),
  };
}

let db;
function load() {
  if (db) return db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  if (!db) db = seed();
  return db;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }

const toPublic = (p) => {
  const { supplier, ...rest } = clone(p);
  rest.inStock = rest.variants.length === 0 || rest.variants.some((v) => v.stock > 0);
  return rest;
};
const toTracking = (o) => ({ ...clone(o), customer: undefined, city: o.customer.city });

function setStatus(o, status, by = 'Admin', note = '') {
  if (o.status === status) return;
  if (o.status === 'e_anuluar') fail(400, 'Porosia e anuluar nuk mund të ndryshohet');
  if (status === 'e_anuluar') {
    for (const i of o.items.filter((x) => x.fromLocalStock)) {
      const v = db.products.find((p) => p._id === i.product)?.variants.find((x) => x._id === i.variantId);
      if (v) v.stock += i.quantity;
    }
  }
  o.status = status;
  o.statusHistory.push({ status, at: new Date().toISOString(), by, note });
  if (status === 'e_dorezuar') o.paid = true;
}

function spreadCargo(s) {
  if (!s.orders.length) return;
  const share = Math.round(s.cargoCostAll / s.orders.length);
  for (const oid of s.orders) { const o = db.orders.find((x) => x._id === oid); if (o) o.costs.cargoAll = share; }
}

const ADMIN = { _id: 'admin', name: 'Admin', email: 'admin@panda.al', role: 'admin' };

export async function demoApi(path, { method = 'GET', body, auth, token } = {}) {
  load();
  await new Promise((r) => setTimeout(r, 120));
  const url = new URL(path, 'http://demo');
  const q = Object.fromEntries(url.searchParams);
  const seg = url.pathname.split('/').filter(Boolean);
  const r = route(method, seg, q, body || {}, { auth, token });
  save();
  return clone(r);
}

const customerFrom = (token) => {
  const c = token && token.startsWith('cust_') && (db.customers || []).find((x) => x._id === token.slice(5) && x.active);
  return c || null;
};
const publicCustomer = (c) => { const { password, ...rest } = c; return rest; };
const activeCategories = () => [...db.categories].filter((c) => c.active).sort((x, y) => x.position - y.position);

function parseLogin(value) {
  const raw = String(value || '').trim();
  if (raw.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) fail(400, 'Email-i nuk është i saktë');
    return { email: raw.toLowerCase() };
  }
  const phone = normalizePhone(raw);
  if (!phone) fail(400, 'Shkruaj një email ose një numër telefoni të saktë (p.sh. 069 123 4567)');
  return { phone };
}

function route(method, seg, q, body, { auth, token } = {}) {
  const [a, b, c, d] = seg;
  db.categories = db.categories || [];
  db.customers = db.customers || [];
  if (a === 'categories') return { categories: activeCategories() };
  if (a === 'customers') {
    if (b === 'register' || b === 'login') {
      const login = parseLogin(body.login);
      const existing = db.customers.find((x) => (login.email && x.email === login.email) || (login.phone && x.phone === login.phone));
      if (b === 'register') {
        if (!String(body.name || '').trim()) fail(400, 'Shkruaj emrin');
        if (String(body.password || '').length < 6) fail(400, 'Fjalëkalimi duhet të ketë të paktën 6 shenja');
        if (existing) fail(409, login.email ? 'Ky email ka tashmë llogari. Hyr me të.' : 'Ky numër ka tashmë llogari. Hyr me të.');
        const cust = { _id: id(), name: body.name.trim(), ...login, password: body.password, address: { city: '', address: '' }, active: true, createdAt: new Date().toISOString() };
        db.customers.unshift(cust);
        return { token: `cust_${cust._id}`, customer: publicCustomer(cust) };
      }
      if (!existing || !existing.active || existing.password !== body.password) fail(401, 'Email/numri ose fjalëkalimi është i gabuar');
      return { token: `cust_${existing._id}`, customer: publicCustomer(existing) };
    }
    const me = customerFrom(token);
    if (!me) fail(401, 'Hyr në llogari ose krijo një llogari për të blerë');
    if (c === 'orders') return { orders: db.orders.filter((o) => o.customerId === me._id).map((o) => ({ ...toTracking(o), phone: o.customer.phone })) };
    if (method === 'PUT') {
      if (body.name !== undefined) { if (!String(body.name).trim()) fail(400, 'Emri nuk mund të jetë bosh'); me.name = String(body.name).trim(); }
      if (body.email) { const { email } = parseLogin(body.email); if (!email) fail(400, 'Email-i nuk është i saktë'); me.email = email; }
      if (body.phone) { const ph = normalizePhone(body.phone); if (!ph) fail(400, 'Numri i telefonit nuk është i saktë'); me.phone = ph; }
      if (body.newPassword) {
        if (body.currentPassword !== me.password) fail(400, 'Fjalëkalimi aktual është i gabuar');
        if (String(body.newPassword).length < 6) fail(400, 'Fjalëkalimi duhet të ketë të paktën 6 shenja');
        me.password = body.newPassword;
      }
    }
    return { customer: publicCustomer(me) };
  }
  if (a === 'config') {
    const { cnyToAll, bank, ...pub } = S();
    if (pub.payments.bank) pub.bank = bank;
    return { ...pub, shippingFee: pub.shipping.fee, freeShippingFrom: pub.shipping.freeFrom, categories: activeCategories(), genders: GENDERS };
  }

  if (a === 'products' && !b) {
    let list = db.products.filter((p) => p.active);
    if (q.category) list = list.filter((p) => p.category === q.category);
    if (q.featured === '1') list = list.filter((p) => p.featured);
    if (q.gender) list = list.filter((p) => [q.gender, 'unisex'].includes(p.gender || 'unisex'));
    if (q.sale === '1') list = list.filter((p) => p.compareAtPrice > p.price);
    if (q.q) list = list.filter((p) => p.name.toLowerCase().includes(q.q.toLowerCase()));
    if (q.sort === 'cmimi-ulet') list.sort((x, y) => x.price - y.price);
    if (q.sort === 'cmimi-larte') list.sort((x, y) => y.price - x.price);
    const limit = Number(q.limit) || 48;
    const page = Number(q.page) || 1;
    return { products: list.slice((page - 1) * limit, page * limit).map(toPublic), total: list.length, page, pages: Math.ceil(list.length / limit) };
  }
  if (a === 'products' && b) {
    const p = db.products.find((x) => x.slug === b && x.active);
    if (!p) fail(404, 'Produkti nuk u gjet');
    return { product: toPublic(p) };
  }
  if (a === 'orders' && method === 'POST') {
    const buyer = customerFrom(auth === 'customer' ? token : null);
    if (!buyer) fail(401, 'Hyr në llogari ose krijo një llogari për të blerë');
    const o = buildOrder(db, body);
    o.customerId = buyer._id;
    buyer.address = { city: o.customer.city, address: o.customer.address };
    db.orders.unshift(o);
    const paymentUrl = o.status === 'pa_paguar' && o.paymentMethod === 'card' ? `/pagesa?${new URLSearchParams({ nr: o.number, ref: o.payment.reference, provova: '1' })}` : null;
    return { order: toTracking(o), paymentUrl };
  }
  if (a === 'payments' && c === 'callback') {
    const o = db.orders.find((x) => x.payment?.reference && x.payment.reference === body.reference);
    if (!o) fail(404, 'Pagesa nuk u gjet');
    if (!o.paid && o.status === 'pa_paguar') {
      if (body.success === true) { o.paid = true; setStatus(o, 'e_re', 'pagesa', 'Paguar me kartë'); }
      else setStatus(o, 'e_anuluar', 'pagesa', 'Pagesa me kartë nuk u krye');
    }
    return { order: toTracking(o) };
  }
  if (a === 'orders' && b === 'track') {
    const phone = normalizePhone(q.phone);
    const o = db.orders.find((x) => x.number === decodeURIComponent(c).toUpperCase().trim() && x.customer.phone === phone);
    if (!o) fail(404, 'Porosia nuk u gjet. Kontrolloni numrin e porosisë dhe telefonin.');
    return { order: toTracking(o) };
  }
  if (a === 'newsletter') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail(400, 'Shkruani një adresë email të saktë');
    if (body.consent !== true) fail(400, 'Duhet të pranoni të merrni njoftime nga Panda.al');
    db.subscribers = db.subscribers || [];
    if (!db.subscribers.some((s) => s.email === email)) db.subscribers.unshift({ _id: id(), email, createdAt: new Date().toISOString() });
    return { ok: true };
  }
  if (a === 'auth') {
    if (b === 'login') {
      if (body.email?.toLowerCase() !== 'admin@panda.al' || body.password !== 'panda1234') fail(401, 'Email ose fjalëkalim i gabuar');
      return { token: 'demo', user: ADMIN };
    }
    return { user: ADMIN };
  }
  if (a !== 'admin') fail(404, 'Nuk u gjet');

  if (b === 'products') {
    if (!c) return { products: [...db.products].reverse() };
    if (method === 'POST') {
      const p = { _id: id(), active: true, featured: false, variants: [], images: [], createdAt: new Date().toISOString(), ...body };
      p.variants = (p.variants || []).map((v) => ({ _id: v._id || id(), ...v }));
      p.slug = slugify(p.name) + (db.products.some((x) => x.slug === slugify(p.name)) ? `-${db.products.length}` : '');
      db.products.push(p);
      return { product: p };
    }
    const p = db.products.find((x) => x._id === c);
    if (!p) fail(404, 'Produkti nuk u gjet');
    if (method === 'DELETE') { db.products = db.products.filter((x) => x._id !== c); return { deleted: true }; }
    if (body.category !== undefined && !db.categories.some((x) => x.key === body.category)) fail(400, 'Zgjidh një kategori që ekziston');
    if (method === 'PUT') { Object.assign(p, body, { _id: p._id, slug: p.slug }); p.variants = p.variants.map((v) => ({ _id: v._id || id(), ...v })); }
    return { product: p };
  }

  if (b === 'orders') {
    if (!c) {
      let list = db.orders;
      if (q.status) list = list.filter((o) => o.status === q.status);
      if (q.q) { const s = q.q.toLowerCase(); list = list.filter((o) => [o.number, o.customer.name, o.customer.phone, o.customer.city].some((f) => f.toLowerCase().includes(s))); }
      const counts = {};
      for (const o of db.orders) counts[o.status] = (counts[o.status] || 0) + 1;
      return { orders: list, counts };
    }
    const o = db.orders.find((x) => x._id === c);
    if (!o) fail(404, 'Porosia nuk u gjet');
    if (method === 'PATCH') {
      if (body.costs) for (const k of ['purchaseCny', 'deliveryAll']) if (body.costs[k] !== undefined) o.costs[k] = Number(body.costs[k]) || 0;
      for (const k of ['courierTracking', 'internalNote']) if (body[k] !== undefined) o[k] = String(body[k]);
      if (body.status) {
        if (o.status === 'pa_paguar' && body.status !== 'e_anuluar') o.paid = true;
        setStatus(o, body.status, 'Admin', body.note || '');
      }
    }
    const s = db.shipments.find((x) => x._id === o.shipment);
    return { order: { ...o, shipment: s ? { _id: s._id, code: s.code, status: s.status } : undefined } };
  }

  if (b === 'purchase-list') {
    if (c === 'mark-bought') {
      const orders = db.orders.filter((o) => body.orderIds.includes(o._id) && o.status === 'e_konfirmuar');
      orders.forEach((o) => setStatus(o, 'e_blere'));
      return { updated: orders.length };
    }
    const groups = new Map();
    for (const o of db.orders.filter((x) => x.status === 'e_konfirmuar')) {
      for (const i of o.items.filter((x) => !x.fromLocalStock)) {
        const key = `${i.product}|${i.size}|${i.color}`;
        const p = db.products.find((x) => x._id === i.product);
        const g = groups.get(key) || { productId: i.product, name: i.name, image: i.image, size: i.size, color: i.color, quantity: 0, orders: [], supplier: p?.supplier || {}, totalCny: 0 };
        g.quantity += i.quantity;
        g.totalCny = (p?.supplier?.costCny || 0) * g.quantity;
        if (!g.orders.some((x) => x.id === o._id)) g.orders.push({ id: o._id, number: o.number });
        groups.set(key, g);
      }
    }
    return { cnyToAll: S().cnyToAll, items: [...groups.values()] };
  }

  if (b === 'shipments') {
    const populate = (s) => ({ ...s, orders: s.orders.map((oid) => db.orders.find((o) => o._id === oid)).filter(Boolean) });
    if (!c && method === 'POST') {
      const d0 = new Date();
      const s = { _id: id(), code: `CN-${String(d0.getFullYear()).slice(2)}${String(d0.getMonth() + 1).padStart(2, '0')}${String(d0.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, status: 'ne_pergatitje', orders: [], weightKg: 0, cargoCostAll: 0, note: '', createdAt: new Date().toISOString() };
      db.shipments.unshift(s);
      return { shipment: s };
    }
    if (!c) return { shipments: db.shipments.map(populate) };
    const s = db.shipments.find((x) => x._id === c);
    if (!s) fail(404, 'Dërgesa nuk u gjet');
    if (d === 'orders' && method === 'POST') {
      const orders = db.orders.filter((o) => body.orderIds.includes(o._id) && ['e_blere', 'ne_magazine'].includes(o.status) && !o.shipment);
      for (const o of orders) { o.shipment = s._id; setStatus(o, 'ne_magazine'); s.orders.push(o._id); }
      spreadCargo(s);
      return { shipment: s, added: orders.length };
    }
    if (d === 'orders' && method === 'DELETE') {
      s.orders = s.orders.filter((x) => x !== seg[4]);
      const o = db.orders.find((x) => x._id === seg[4]);
      if (o) { delete o.shipment; o.costs.cargoAll = 0; }
      spreadCargo(s);
      return { shipment: s };
    }
    if (method === 'PATCH') {
      for (const k of ['weightKg', 'cargoCostAll']) if (body[k] !== undefined) s[k] = Number(body[k]) || 0;
      if (body.note !== undefined) s.note = body.note;
      if (body.status && body.status !== s.status) {
        s.status = body.status;
        if (body.status === 'nisur') s.departedAt = new Date().toISOString();
        if (body.status === 'mberritur') s.arrivedAt = new Date().toISOString();
        const os = { nisur: 'ne_rruge', mberritur: 'ne_shqiperi' }[body.status];
        for (const oid of s.orders) { const o = db.orders.find((x) => x._id === oid); if (o && o.status !== 'e_anuluar') setStatus(o, os, 'Admin', `Dërgesa ${s.code}`); }
      }
      spreadCargo(s);
    }
    return { shipment: populate(s) };
  }

  if (b === 'categories') {
    const sorted = [...db.categories].sort((x, y) => x.position - y.position);
    if (!c && method === 'GET') return { categories: sorted.map((x) => ({ ...x, products: db.products.filter((p) => p.category === x.key).length })) };
    if (!c && method === 'POST') {
      const label = String(body.label || '').trim();
      if (!label) fail(400, 'Shkruaj emrin e kategorisë');
      const key = slugify(label);
      if (db.categories.some((x) => x.key === key)) fail(409, 'Kjo kategori ekziston tashmë');
      const cat = { _id: id(), key, label, emoji: String(body.emoji || '').trim(), image: '', position: sorted.length, active: true };
      db.categories.push(cat);
      return { category: cat };
    }
    const cat = db.categories.find((x) => x._id === c);
    if (!cat) fail(404, 'Kategoria nuk u gjet');
    if (d === 'move') {
      const i = sorted.indexOf(cat);
      const j = body.direction === 'up' ? i - 1 : i + 1;
      if (j >= 0 && j < sorted.length) [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      sorted.forEach((x, pos) => { x.position = pos; });
      return { ok: true };
    }
    if (method === 'DELETE') {
      const used = db.products.filter((p) => p.category === cat.key).length;
      if (used) fail(400, `Kjo kategori ka ${used} produkte. Kaloji te një kategori tjetër ose fshiji, pastaj fshi kategorinë.`);
      db.categories = db.categories.filter((x) => x !== cat);
      return { ok: true };
    }
    if (body.label !== undefined) { if (!String(body.label).trim()) fail(400, 'Emri nuk mund të jetë bosh'); cat.label = String(body.label).trim(); }
    if (body.emoji !== undefined) cat.emoji = String(body.emoji).trim();
    if (body.image !== undefined) cat.image = body.image;
    if (body.active !== undefined) cat.active = Boolean(body.active);
    return { category: cat };
  }
  if (b === 'customers') {
    if (!c) {
      const term = String(q.q || '').toLowerCase();
      const list = db.customers.filter((x) => !term || [x.name, x.email, x.phone].some((f) => (f || '').toLowerCase().includes(term)));
      return { customers: list.map((x) => {
        const mine = db.orders.filter((o) => o.customerId === x._id && o.status !== 'pa_paguar');
        return { ...publicCustomer(x), orders: mine.length, spent: mine.filter((o) => o.paid).reduce((sum, o) => sum + o.total, 0) };
      }) };
    }
    const cust = db.customers.find((x) => x._id === c);
    if (!cust) fail(404, 'Klienti nuk u gjet');
    if (body.active !== undefined) cust.active = Boolean(body.active);
    if (body.password) { if (String(body.password).length < 6) fail(400, 'Fjalëkalimi duhet të ketë të paktën 6 shenja'); cust.password = body.password; }
    return { customer: publicCustomer(cust) };
  }
  if (b === 'subscribers') return { subscribers: db.subscribers || [], total: (db.subscribers || []).length };
  if (b === 'settings') {
    if (method === 'PUT') {
      const ok = (u, rel) => !u || /^https?:\/\//i.test(u) || (rel && u.startsWith('/') && !u.startsWith('//'));
      if (body.homeBanner) {
        const hb = body.homeBanner;
        if (!ok(hb.url) || !ok(hb.posterUrl)) fail(400, 'Linku duhet të fillojë me https://');
        if (!ok(hb.link, true)) fail(400, 'Linku kur shtypet duhet të fillojë me https:// ose /');
        S().homeBanner = { url: (hb.url || '').trim(), posterUrl: (hb.posterUrl || '').trim(), link: (hb.link || '').trim() };
      }
      if (body.home) S().home = {
        featuredTitle: String(body.home.featuredTitle || '').trim() || 'Më të pëlqyerat',
        latestTitle: String(body.home.latestTitle || '').trim() || 'Të rejat',
        newsletterTitle: String(body.home.newsletterTitle || '').trim() || DEFAULT_SETTINGS.home.newsletterTitle,
      };
      if (body.pages) S().pages = { about: String(body.pages.about || '').trim(), info: String(body.pages.info || '').trim(), terms: String(body.pages.terms || '').trim() };
      if (body.promoBar) S().promoBar = { enabled: Boolean(body.promoBar.enabled), text: String(body.promoBar.text || '').trim() };
      if (body.shipping) {
        const sh = body.shipping;
        if (![sh.fee, sh.freeFrom].every((n) => Number.isFinite(Number(n)) && Number(n) >= 0)) fail(400, 'Vlerë e pavlefshme te transporti');
        S().shipping = { fee: Math.round(sh.fee), freeFrom: Math.round(sh.freeFrom), localText: sh.localText || '1–3 ditë pune', chinaText: sh.chinaText || '10–18 ditë' };
      }
      if (body.bank) {
        const iban = String(body.bank.iban || '').replace(/\s+/g, '').toUpperCase();
        if (iban) {
          const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
          let rest = 0;
          for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
          if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban) || (iban.startsWith('AL') && iban.length !== 28) || rest !== 1) {
            fail(400, 'IBAN-i nuk është i saktë. Një IBAN shqiptar ka 28 shenja dhe fillon me AL.');
          }
        }
        S().bank = { holder: String(body.bank.holder || '').trim(), bankName: String(body.bank.bankName || '').trim(), iban, swift: String(body.bank.swift || '').replace(/\s+/g, '').toUpperCase() };
      }
      if (body.payments) {
        const p2 = { card: Boolean(body.payments.card), cod: Boolean(body.payments.cod), bank: Boolean(body.payments.bank) };
        if (!p2.card && !p2.cod && !p2.bank) fail(400, 'Duhet të paktën një mënyrë pagese');
        if (p2.bank && !(S().bank?.iban && S().bank?.holder)) fail(400, 'Për transfertën bankare, plotëso më parë llogarinë bankare (emri dhe IBAN-i).');
        S().payments = p2;
      }
      if (body.contact) {
        const wa = String(body.contact.whatsapp || '').replace(/\D/g, '');
        if (wa && (wa.length < 9 || wa.length > 15)) fail(400, 'Numri i WhatsApp duhet me prefiks, p.sh. 355691234567');
        S().contact = { whatsapp: wa, phone: String(body.contact.phone || '').trim(), email: String(body.contact.email || '').trim() };
      }
      if (body.cnyToAll !== undefined) {
        if (!(Number(body.cnyToAll) > 0)) fail(400, 'Kursi i juanit nuk është i saktë');
        S().cnyToAll = Number(body.cnyToAll);
      }
    }
    return { settings: S() };
  }
  if (b === 'reports') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const orders = db.orders.filter((o) => new Date(o.createdAt) >= from && !(o.paymentMethod === 'card' && !o.paid && ['pa_paguar', 'e_anuluar'].includes(o.status)));
    const delivered = orders.filter((o) => o.status === 'e_dorezuar');
    const costOf = (o) => Math.round(o.costs.purchaseCny * S().cnyToAll) + o.costs.cargoAll + o.costs.deliveryAll;
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const costs = delivered.reduce((s, o) => s + costOf(o), 0);
    const top = new Map();
    for (const o of orders.filter((x) => x.status !== 'e_anuluar')) for (const i of o.items) {
      const row = top.get(i.product) || { name: i.name, quantity: 0, revenue: 0 };
      row.quantity += i.quantity; row.revenue += i.quantity * i.unitPrice; top.set(i.product, row);
    }
    return {
      orders: orders.length, delivered: delivered.length, cancelled: orders.filter((o) => o.status === 'e_anuluar').length,
      revenue, costs, profit: revenue - costs,
      pendingValue: orders.filter((o) => !['e_dorezuar', 'e_anuluar'].includes(o.status)).reduce((s, o) => s + o.total, 0),
      topProducts: [...top.values()].sort((x, y) => y.quantity - x.quantity).slice(0, 10),
    };
  }
  fail(404, 'Nuk u gjet');
}

export function resetDemo() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('panda_cart_v1'); } catch { /* ignore */ }
  db = null;
}
