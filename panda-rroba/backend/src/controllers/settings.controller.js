const Setting = require('../models/Setting');
const { HttpError } = require('../middleware/errorHandler');
const { getShopSettings } = require('../services/settings.service');

// Only http(s) URLs or site-relative paths, so nothing like javascript: ends up in the page.
function cleanUrl(value, label, { relative = false } = {}) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || (relative && url.startsWith('/') && !url.startsWith('//'))) return url.slice(0, 1000);
  throw new HttpError(400, `${label} duhet të fillojë me https://${relative ? ' ose /' : ''}`);
}

const text = (value, max = 200) => String(value ?? '').trim().slice(0, max);

function money(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e7) throw new HttpError(400, `${label}: vlerë e pavlefshme`);
  return Math.round(n);
}

// Normalises an IBAN and checks its length and ISO 13616 check digits.
function cleanIban(value) {
  const iban = String(value ?? '').replace(/\s+/g, '').toUpperCase();
  if (!iban) return '';
  const lengths = { AL: 28, XK: 20, MK: 19, ME: 22, IT: 27, GR: 27, DE: 22 };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban) || (lengths[iban.slice(0, 2)] && iban.length !== lengths[iban.slice(0, 2)])) {
    throw new HttpError(400, 'IBAN-i nuk është i saktë. Një IBAN shqiptar ka 28 shenja dhe fillon me AL.');
  }
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  if (rest !== 1) throw new HttpError(400, 'IBAN-i nuk është i saktë: kontrollo shifrat (shifrat e kontrollit nuk përputhen).');
  return iban;
}

async function get(_req, res) {
  res.json({ settings: await getShopSettings() });
}

/** Saves whichever sections are sent; sections left out stay as they are. */
async function update(req, res) {
  const body = req.body || {};
  const doc = (await Setting.findById('shop')) || new Setting({ _id: 'shop' });

  if (body.homeBanner) {
    doc.homeBanner = {
      url: cleanUrl(body.homeBanner.url, 'Linku i videos/fotos'),
      posterUrl: cleanUrl(body.homeBanner.posterUrl, 'Fotoja e parapamjes'),
      link: cleanUrl(body.homeBanner.link, 'Linku kur shtypet', { relative: true }),
    };
  }
  if (body.promoBar) {
    doc.promoBar = { enabled: Boolean(body.promoBar.enabled), text: text(body.promoBar.text, 160) };
  }
  if (body.shipping) {
    doc.shipping = {
      fee: money(body.shipping.fee, 'Kosto e transportit'),
      freeFrom: money(body.shipping.freeFrom, 'Transport falas mbi'),
      localText: text(body.shipping.localText, 60) || '1–3 ditë pune',
      chinaText: text(body.shipping.chinaText, 60) || '10–18 ditë',
    };
  }
  if (body.bank) {
    const swift = text(body.bank.swift, 11).replace(/\s+/g, '').toUpperCase();
    if (swift && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift)) throw new HttpError(400, 'Kodi SWIFT/BIC nuk është i saktë (8 ose 11 shenja)');
    doc.bank = { holder: text(body.bank.holder, 120), bankName: text(body.bank.bankName, 80), iban: cleanIban(body.bank.iban), swift };
  }
  if (body.payments) {
    const card = Boolean(body.payments.card);
    const cod = Boolean(body.payments.cod);
    const bank = Boolean(body.payments.bank);
    if (!card && !cod && !bank) throw new HttpError(400, 'Duhet të paktën një mënyrë pagese');
    if (bank && !(doc.bank?.iban && doc.bank?.holder)) throw new HttpError(400, 'Për transfertën bankare, plotëso më parë llogarinë bankare (emri dhe IBAN-i).');
    doc.payments = { card, cod, bank };
  }
  if (body.contact) {
    const whatsapp = String(body.contact.whatsapp ?? '').replace(/\D/g, '');
    if (whatsapp && (whatsapp.length < 9 || whatsapp.length > 15)) throw new HttpError(400, 'Numri i WhatsApp duhet me prefiks, p.sh. 355691234567');
    const email = text(body.contact.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'Email-i i kontaktit nuk është i saktë');
    doc.contact = { whatsapp, phone: text(body.contact.phone, 40), email };
  }
  if (body.home) {
    doc.home = {
      featuredTitle: text(body.home.featuredTitle, 60) || 'Më të pëlqyerat',
      latestTitle: text(body.home.latestTitle, 60) || 'Të rejat',
      newsletterTitle: text(body.home.newsletterTitle, 160) || 'Regjistrohu dhe mëso të parën për ofertat dhe koleksionet e reja.',
    };
  }
  if (body.pages) {
    // Plain text; the shop renders it as text (lines starting with "## " become headings).
    const page = (v) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, 20000);
    doc.pages = { about: page(body.pages.about), info: page(body.pages.info), terms: page(body.pages.terms) };
  }
  if (body.cnyToAll !== undefined) {
    const rate = Number(body.cnyToAll);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) throw new HttpError(400, 'Kursi i juanit nuk është i saktë');
    doc.cnyToAll = rate;
  }

  await doc.save();
  res.json({ settings: await getShopSettings() });
}

module.exports = { get, update };
