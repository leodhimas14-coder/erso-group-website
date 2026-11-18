const Setting = require('../models/Setting');

// Defaults used until the owner saves something in Admin → Cilësimet.
function defaults() {
  return {
    homeBanner: { url: '', posterUrl: '', link: '' },
    promoBar: { enabled: true, text: 'Transport falas mbi 6.000 L · Dërgesa në gjithë Shqipërinë' },
    shipping: {
      fee: Number(process.env.SHIPPING_FEE ?? 300),
      freeFrom: Number(process.env.FREE_SHIPPING_FROM ?? 6000),
      localText: '1–3 ditë pune',
      chinaText: '10–18 ditë',
    },
    payments: { card: true, cod: false, bank: false },
    bank: { holder: '', bankName: '', iban: '', swift: '' },
    contact: { whatsapp: process.env.WHATSAPP || '', phone: '', email: '' },
    home: {
      featuredTitle: 'Më të pëlqyerat',
      latestTitle: 'Të rejat',
      newsletterTitle: 'Regjistrohu dhe mëso të parën për ofertat dhe koleksionet e reja.',
    },
    pages: { about: '', info: '', terms: '' },
    cnyToAll: Number(process.env.CNY_TO_ALL ?? 13),
  };
}

const isSet = (v) => v !== undefined && v !== null;

/** Saved settings merged over the defaults, section by section. */
async function getShopSettings() {
  const saved = (await Setting.findById('shop').lean()) || {};
  const base = defaults();
  const out = {};
  for (const [section, value] of Object.entries(base)) {
    if (typeof value !== 'object') {
      out[section] = isSet(saved[section]) ? saved[section] : value;
      continue;
    }
    out[section] = { ...value };
    for (const key of Object.keys(value)) {
      if (isSet(saved[section]?.[key])) out[section][key] = saved[section][key];
    }
  }
  return out;
}

/** What the public shop is allowed to see: no exchange rate, and the bank
 * account only while bank transfer is offered to customers. */
function publicSettings(s) {
  const { cnyToAll, bank, ...rest } = s;
  return s.payments.bank ? { ...rest, bank } : rest;
}

module.exports = { getShopSettings, publicSettings, defaults };
