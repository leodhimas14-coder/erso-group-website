const mongoose = require('mongoose');

// Product categories, managed by the owner in Admin → Kategoritë.
const categorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used in links, never changes
    label: { type: String, required: true, trim: true },
    emoji: { type: String, trim: true, default: '' }, // shown on the home page chips
    image: { type: String, trim: true, default: '' }, // optional photo instead of the emoji
    position: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
