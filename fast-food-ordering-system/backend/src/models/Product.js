const mongoose = require('mongoose');

// A selectable customization option, e.g. size, extra topping, sauce choice
const optionChoiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    priceDelta: { type: Number, default: 0 }, // added/subtracted from base price
    // Optional link to the inventory item this choice consumes, for recipe deduction
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    ingredientQty: { type: Number, default: 0 },
  },
  { _id: false }
);

const optionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size", "Extras", "Sauce"
    required: { type: Boolean, default: false },
    multiSelect: { type: Boolean, default: false },
    choices: [optionChoiceSchema],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true }, // e.g. Burgers, Sides, Drinks, Combos
    basePrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    available: { type: Boolean, default: true },
    optionGroups: [optionGroupSchema],
    // Recipe: base ingredients consumed regardless of customization
    recipe: [
      {
        ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true }, // must match InventoryItem.unit
      },
    ],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
