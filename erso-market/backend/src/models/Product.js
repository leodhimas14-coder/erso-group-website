const mongoose = require('mongoose');
const { GENDERS, keys } = require('../config/constants');

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    // Units already in the Albania warehouse. 0 means "order from China" (longer delivery).
    stock: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true }, // a Category key; checked when saving from the admin
    gender: { type: String, enum: keys(GENDERS), default: 'unisex' },
    description: { type: String, default: '' },
    images: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 }, // in the shop currency (Admin → Cilësimet)
    // Smallest quantity a customer can order (e.g. 10 air conditioners).
    minQty: { type: Number, min: 1, default: 1 },
    // Price hidden in the shop; customers ask for a quote on WhatsApp instead of buying.
    priceOnRequest: { type: Boolean, default: false },
    // Technical details shown as a table on the product page.
    specs: { type: [{ label: { type: String, trim: true }, value: { type: String, trim: true }, _id: false }], default: [] },
    compareAtPrice: { type: Number, min: 0 }, // old price shown crossed out
    variants: { type: [variantSchema], default: [] },
    // Supplier info is internal only and never sent to the shop.
    supplier: {
      name: { type: String, trim: true, default: '' },
      url: { type: String, trim: true, default: '' },
      costCny: { type: Number, min: 0, default: 0 },
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, active: 1, createdAt: -1 });
productSchema.index({ gender: 1, active: 1, createdAt: -1 });

productSchema.methods.toPublic = function toPublic() {
  const { supplier, ...rest } = this.toObject();
  // Only stock that is already in Albania counts; everything else is ordered from the factory.
  rest.inStock = rest.variants.some((v) => v.stock > 0);
  return rest;
};

module.exports = mongoose.model('Product', productSchema);
