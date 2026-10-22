// In-browser stand-in for the backend, used only by the demo build
// (`npm run build:demo`). It mirrors the real API routes closely enough to
// click through the whole shop and admin panel without a server. Data lives
// in this browser only.

const KEY = 'erso_demo_db_v1';
const DEFAULT_SETTINGS = {
  homeBanner: { url: '', posterUrl: '', link: '' },
  promoBar: { enabled: true, text: 'Direkt nga fabrikat në Kinë · Inspektim para pagesës · Zhdoganim në Shqipëri' },
  shipping: { fee: 0, freeFrom: 0, localText: '3–7 ditë pune', chinaText: '35–50 ditë' },
  payments: { card: true, cod: false, bank: false },
  home: { featuredTitle: 'Më të kërkuarat', latestTitle: 'Të sapoardhurat', newsletterTitle: 'Regjistrohu dhe merr të parin ofertat për makina, motorra dhe pajisje nga Kina.' },
  pages: { about: '', info: '', terms: '' },
  bank: { holder: '', bankName: '', iban: '', swift: '' },
  contact: { whatsapp: '355694655011', phone: '+355 69 465 5011', email: '' },
  cnyToAll: 0.13,
  currency: 'EUR',
};
const S = () => {
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) if (db.settings[k] === undefined) db.settings[k] = clone(v);
  return db.settings;
};

const CATEGORIES = [
  { key: 'makina', label: 'Makina' }, { key: 'makineta', label: 'Makineta & Skuter' }, { key: 'motorra', label: 'Motorra' },
  { key: 'shtepiake', label: 'Shtëpiake' }, { key: 'ndertim', label: 'Ndërtim' }, { key: 'pista-detare', label: 'Pista detare' },
];
const GENDERS = [
  { key: 'femra', label: 'Femra' }, { key: 'meshkuj', label: 'Meshkuj' }, { key: 'femije', label: 'Fëmijë' }, { key: 'unisex', label: 'Unisex' },
];
const FLOW = ['e_re', 'e_konfirmuar', 'e_blere', 'ne_magazine', 'ne_rruge', 'ne_shqiperi', 'ne_dorezim', 'e_dorezuar'];

let uid = Date.now();
const id = () => (uid++).toString(16).padStart(24, '0');
const clone = (x) => JSON.parse(JSON.stringify(x));
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };

// Line drawings standing in for product photos in the demo.
const ART = {
  car: '<path d="M4 33v-8l6-9h21l8 9h5v8z"/><circle cx="13" cy="34" r="4.5"/><circle cx="35" cy="34" r="4.5"/><path class="a" d="M12 25l4-6h7v6zM26 25v-6h3l5 6z"/>',
  van: '<path d="M4 33V15h24v18M28 20h9l7 8v5H4"/><circle cx="13" cy="34" r="4.5"/><circle cx="35" cy="34" r="4.5"/><path class="a" d="M31 23h5l4 5h-9z"/>',
  scooter: '<circle cx="11" cy="36" r="5"/><circle cx="37" cy="36" r="5"/><path d="M11 36h12l6-7h8M33 29l3-19h6M13 26h12v3"/><path class="a" d="M36 10h-4M16 22h7"/>',
  atv: '<circle cx="11" cy="34" r="7"/><circle cx="37" cy="34" r="7"/><path d="M11 27h26l-4-8H18zM33 19l3-6h5"/><path class="a" d="M20 23h9"/>',
  moto: '<circle cx="10" cy="33" r="7"/><circle cx="38" cy="33" r="7"/><path d="M10 33l8-12h11l9 12M29 21l4-7h6M18 21l-3-5h-5"/><path class="a" d="M19 25h10"/>',
  ac: '<rect x="4" y="9" width="40" height="17" rx="3"/><path d="M8 21h32"/><path class="a" d="M14 31c-2 3 2 5 0 9M24 31c-2 3 2 5 0 9M34 31c-2 3 2 5 0 9"/>',
  washer: '<rect x="9" y="5" width="30" height="38" rx="3"/><path d="M9 13h30"/><circle cx="24" cy="28" r="9"/><path class="a" d="M18 30c3 2 9 2 12-2"/>',
  fridge: '<rect x="12" y="4" width="24" height="40" rx="3"/><path d="M12 18h24"/><path class="a" d="M17 9v5M17 23v8"/>',
  excavator: '<path d="M4 41h30"/><rect x="5" y="33" width="26" height="8" rx="4"/><path d="M9 33v-9h13v9"/><path class="a" d="M22 27l9-14 11 8-3 6M39 27l4 6h-9z"/>',
  mixer: '<path d="M6 41h30"/><circle cx="11" cy="41" r="3"/><circle cx="31" cy="41" r="3"/><path d="M13 35l6-22 16 8-8 14z"/><path class="a" d="M21 19l10 5"/>',
  pontoon: '<path d="M4 29h40M6 29v-6h10v6M19 29v-6h10v6M32 29v-6h10v6M11 23v-9M37 23v-9"/><path class="a" d="M3 36c3-2 5 2 8 0s5 2 8 0 5 2 8 0 5 2 8 0 5 2 7 0"/>',
  dock: '<path d="M6 25h22l-4 7H10zM14 25v-9l8 9M28 30h16M32 30v8M40 30v8"/><path class="a" d="M3 41c3-2 5 2 8 0s5 2 8 0 5 2 8 0 5 2 8 0 5 2 7 0"/>',
};
function art(icon) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="g" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#2a2c33"/><stop offset="1" stop-color="#0b0c0f"/></radialGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8f939b"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect x="0" y="252" width="400" height="48" fill="#000" opacity=".35"/><g transform="translate(110 40) scale(3.75)" fill="none" stroke="url(#s)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><style>.a{stroke:#c81f2f}</style>${ART[icon] || ART.car}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seed() {
  const v = (list) => list.map((x) => ({ _id: id(), size: '', color: '', stock: 0, ...x }));
  const sp = (...pairs) => pairs.map(([label, value]) => ({ label, value }));
  const products = [
    { name: 'Makinë elektrike kompakte, 5 vende', category: 'makina', price: 11200, minQty: 1, featured: true, images: [art('car')], description: 'Bateri LFP, autonomi rreth 400 km, karikim i shpejtë DC. Timon majtas, për rrugët e Evropës.', specs: sp(['Bateria', '45 kWh LFP'], ['Autonomia', '~400 km (CLTC)'], ['Karikimi', 'AC 7 kW · DC 60 kW']), variants: v(['E bardhë', 'Gri', 'E zezë'].map((color) => ({ color }))), supplier: { name: 'Fabrikë në Hefei', url: '', costCny: 62000 } },
    { name: 'Furgon elektrik ngarkese, 1 ton', category: 'makina', price: 12800, images: [art('van')], description: 'Për dorëzime në qytet: 5 m³ vëllim, 1 000 kg ngarkesë.', specs: sp(['Ngarkesa', '1 000 kg'], ['Vëllimi', '5 m³'], ['Autonomia', '~260 km']), supplier: { name: 'Fabrikë në Chongqing', url: '', costCny: 70000 } },
    { name: 'Skuter elektrik 72V 3000W', category: 'makineta', price: 1290, minQty: 2, featured: true, images: [art('scooter')], description: 'Dy bateri litium, frena disku, ndriçim LED.', specs: sp(['Motori', '3000 W'], ['Autonomia', '~110 km'], ['Shpejtësia', 'deri 70 km/h']), variants: v(['E zezë', 'Gri'].map((color) => ({ color, stock: color === 'E zezë' ? 2 : 0 }))), supplier: { name: 'Fabrikë në Wuxi', url: '', costCny: 5200 } },
    { name: 'ATV / Kuad 150cc për terren', category: 'makineta', price: 1500, minQty: 2, images: [art('atv')], description: 'Transmision automatik, rrota 8", për fermë dhe turizëm.', specs: sp(['Motori', '150 cc'], ['Transmisioni', 'Automatik CVT']), supplier: { name: 'Fabrikë në Yongkang', url: '', costCny: 6400 } },
    { name: 'Motor enduro 250cc', category: 'motorra', price: 1880, compareAtPrice: 2100, minQty: 2, featured: true, images: [art('moto')], description: 'Ftohje me ujë, pezullim përpara i rregullueshëm.', specs: sp(['Motori', '250 cc, 1 cilindër'], ['Pesha', '~118 kg']), supplier: { name: 'Fabrikë në Chongqing', url: '', costCny: 8200 } },
    { name: 'Motor elektrik 5000W, 120 km', category: 'motorra', price: 2600, minQty: 2, images: [art('moto')], description: 'Bateri litium 72V 60Ah, shpejtësi deri 95 km/h.', specs: sp(['Motori', '5000 W'], ['Autonomia', '~120 km'], ['Karikimi', '6–7 orë']), supplier: { name: 'Fabrikë në Wuxi', url: '', costCny: 11500 } },
    { name: 'Kondicioner inverter 12000 BTU', category: 'shtepiake', price: 245, minQty: 10, featured: true, images: [art('ac')], description: 'Klasa A++, gaz R32, ngrohje dhe ftohje, WiFi opsional.', specs: sp(['Fuqia', '12000 BTU'], ['Klasa', 'A++ / A+'], ['Gazi', 'R32']), variants: v([{ color: 'E bardhë', stock: 20 }]), supplier: { name: 'Fabrikë në Ningbo', url: '', costCny: 1100 } },
    { name: 'Lavatriçe 9 kg, 1400 rrotullime', category: 'shtepiake', price: 215, minQty: 10, images: [art('washer')], description: 'Motor inverter, 15 programe, klasa A.', specs: sp(['Kapaciteti', '9 kg'], ['Rrotullimet', '1400 / min']), supplier: { name: 'Fabrikë në Foshan', url: '', costCny: 950 } },
    { name: 'Mini ekskavator 1.8 ton', category: 'ndertim', price: 11000, featured: true, images: [art('excavator')], description: 'Motor 3 cilindra, kovë standarde, çekiç hidraulik opsional.', specs: sp(['Pesha', '1 800 kg'], ['Thellësia e gërmimit', '2.2 m']), supplier: { name: 'Fabrikë në Jining', url: '', costCny: 52000 } },
    { name: 'Betonierë 350 L me motor elektrik', category: 'ndertim', price: 490, minQty: 4, images: [art('mixer')], description: 'Motor 2.2 kW, rrota për transport, 230 V.', specs: sp(['Kapaciteti', '350 L'], ['Motori', '2.2 kW']), supplier: { name: 'Fabrikë në Zhejiang', url: '', costCny: 2100 } },
    { name: 'Pontone modulare HDPE 50×50 cm', category: 'pista-detare', price: 21, minQty: 200, images: [art('pontoon')], description: 'Kube lundruese anti-UV për pista, platforma dhe xhet-ski.', specs: sp(['Materiali', 'HDPE anti-UV'], ['Ngarkesa', '~350 kg/m²']), supplier: { name: 'Fabrikë në Ningbo', url: '', costCny: 85 } },
    { name: 'Pistë lundruese alumini 12 m', category: 'pista-detare', price: 0, priceOnRequest: true, featured: true, images: [art('dock')], description: 'Module 3 m me pontone, dysheme WPC kundër rrëshqitjes. Çmimi varet nga ankorimi dhe gjatësia.', specs: sp(['Gjatësia', '12 m (4 module)'], ['Garancia', '5 vjet struktura']), supplier: { name: 'Fabrikë në Guangzhou', url: '', costCny: 0 } },
  ].map((p) => ({ _id: id(), slug: slugify(p.name), active: true, featured: false, compareAtPrice: undefined, minQty: 1, priceOnRequest: false, specs: [], variants: [], gender: 'unisex', createdAt: new Date().toISOString(), ...p }));

  const emoji = { makina: '🚗', makineta: '🛵', motorra: '🏍️', shtepiake: '❄️', ndertim: '🏗️', 'pista-detare': '⚓' };
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
  const o1 = mk('Elira Kola', '0682345678', 'Durrës', [P(6, 0, 20)], 'e_dorezuar', 9, { paid: true, costs: { purchaseCny: 22000, cargoAll: 600, deliveryAll: 150 } });
  const o2 = mk('Besnik Shehu', '0695551122', 'Vlorë', [P(2, 1, 4)], 'ne_rruge', 6);
  const o3 = mk('Klea Murati', '0674448899', 'Tiranë', [P(8)], 'e_konfirmuar', 1);
  const o4 = mk('Arbër Gjoka', '0693217788', 'Shkodër', [P(4, 0, 2), P(9, 0, 4)], 'e_re', 0.2);
  o4.customerId = customers[0]._id;
  db.shipments.push({ _id: id(), code: 'CN-261010-A7K', status: 'nisur', orders: [o2._id], weightKg: 380, cargoCostAll: 900, departedAt: new Date(Date.now() - 3 * day).toISOString(), note: '', createdAt: new Date(Date.now() - 4 * day).toISOString() });
  o2.shipment = db.shipments[0]._id;
  o2.costs.cargoAll = 900;
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
    if (p.variants.length && !variant) fail(400, `Zgjidhni versionin/ngjyrën për "${p.name}"`);
    if (!seeding && p.priceOnRequest) fail(400, `"${p.name}" ka çmim me ofertë. Na kontaktoni për ta porositur.`);
    if (!seeding && raw.quantity < (p.minQty || 1)) fail(400, `Për "${p.name}" porosia minimale është ${p.minQty} copë`);
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
    _id: id(), number: `ER-${db.seq}`, customer: { name: c.name.trim(), phone, city: c.city, address: c.address.trim(), note: String(c.note || '') },
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
  rest.inStock = rest.variants.some((v) => v.stock > 0);
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

const ADMIN = { _id: 'admin', name: 'Admin', email: 'admin@ersomarket.al', role: 'admin' };

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
    if (body.consent !== true) fail(400, 'Duhet të pranoni të merrni njoftime nga ERSO Market');
    db.subscribers = db.subscribers || [];
    if (!db.subscribers.some((s) => s.email === email)) db.subscribers.unshift({ _id: id(), email, createdAt: new Date().toISOString() });
    return { ok: true };
  }
  if (a === 'auth') {
    if (b === 'login') {
      if (body.email?.toLowerCase() !== 'admin@ersomarket.al' || body.password !== 'erso1234') fail(401, 'Email ose fjalëkalim i gabuar');
      return { token: 'demo', user: ADMIN };
    }
    return { user: ADMIN };
  }
  if (a !== 'admin') fail(404, 'Nuk u gjet');

  if (b === 'products') {
    if (!c) return { products: [...db.products].reverse() };
    const cleanB2b = (x) => {
      if (x.minQty !== undefined) { const n = Number(x.minQty); if (!Number.isInteger(n) || n < 1 || n > 100000) fail(400, 'Porosia minimale duhet të jetë një numër i plotë nga 1 deri në 100 000'); x.minQty = n; }
      if (x.specs !== undefined) x.specs = (x.specs || []).map((r) => ({ label: String(r.label || '').trim(), value: String(r.value || '').trim() })).filter((r) => r.label && r.value).slice(0, 30);
      if (x.priceOnRequest !== undefined) x.priceOnRequest = Boolean(x.priceOnRequest);
    };
    cleanB2b(body);
    if (method === 'POST') {
      const p = { _id: id(), active: true, featured: false, variants: [], images: [], minQty: 1, priceOnRequest: false, specs: [], createdAt: new Date().toISOString(), ...body };
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
        featuredTitle: String(body.home.featuredTitle || '').trim() || DEFAULT_SETTINGS.home.featuredTitle,
        latestTitle: String(body.home.latestTitle || '').trim() || DEFAULT_SETTINGS.home.latestTitle,
        newsletterTitle: String(body.home.newsletterTitle || '').trim() || DEFAULT_SETTINGS.home.newsletterTitle,
      };
      if (body.pages) S().pages = { about: String(body.pages.about || '').trim(), info: String(body.pages.info || '').trim(), terms: String(body.pages.terms || '').trim() };
      if (body.promoBar) S().promoBar = { enabled: Boolean(body.promoBar.enabled), text: String(body.promoBar.text || '').trim() };
      if (body.shipping) {
        const sh = body.shipping;
        if (![sh.fee, sh.freeFrom].every((n) => Number.isFinite(Number(n)) && Number(n) >= 0)) fail(400, 'Vlerë e pavlefshme te transporti');
        S().shipping = { fee: Math.round(sh.fee), freeFrom: Math.round(sh.freeFrom), localText: sh.localText || DEFAULT_SETTINGS.shipping.localText, chinaText: sh.chinaText || DEFAULT_SETTINGS.shipping.chinaText };
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
      if (body.currency !== undefined) {
        if (!['EUR', 'ALL'].includes(body.currency)) fail(400, 'Monedha duhet të jetë EUR ose ALL');
        S().currency = body.currency;
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
  try { localStorage.removeItem(KEY); localStorage.removeItem('erso_cart_v1'); } catch { /* ignore */ }
  db = null;
}
