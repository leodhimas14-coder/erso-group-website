const mongoose = require('mongoose');

// One document holding everything the owner can change from Admin → Cilësimet.
// Empty/missing values fall back to the defaults in services/settings.service.js.
const settingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'shop' },
    // Banner at the top of the home page. Empty url = no banner.
    homeBanner: {
      url: { type: String, trim: true, default: '' }, // .mp4/.webm video or an image
      posterUrl: { type: String, trim: true, default: '' }, // image shown while the video loads
      link: { type: String, trim: true, default: '' }, // where a tap goes, e.g. /dyqani?oferta=1
    },
    promoBar: {
      enabled: { type: Boolean },
      text: { type: String, trim: true },
    },
    shipping: {
      fee: { type: Number, min: 0 }, // lekë
      freeFrom: { type: Number, min: 0 }, // free shipping at or above this subtotal; 0 = never free
      localText: { type: String, trim: true }, // delivery time for items in Albania stock
      chinaText: { type: String, trim: true }, // delivery time for items ordered from China
    },
    payments: {
      card: { type: Boolean },
      cod: { type: Boolean },
      bank: { type: Boolean }, // customer pays by bank transfer to the IBAN below
    },
    // The shop's bank account: shown to customers who pay by transfer, and the
    // account to give the card provider for payouts.
    bank: {
      holder: { type: String, trim: true },
      bankName: { type: String, trim: true },
      iban: { type: String, trim: true },
      swift: { type: String, trim: true },
    },
    contact: {
      whatsapp: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    // Texts the owner can rewrite. Empty = the shop's built-in text.
    home: {
      featuredTitle: { type: String, trim: true },
      latestTitle: { type: String, trim: true },
      newsletterTitle: { type: String, trim: true },
    },
    pages: {
      about: { type: String },
      info: { type: String },
      terms: { type: String },
    },
    cnyToAll: { type: Number, min: 0 },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Setting', settingSchema);
