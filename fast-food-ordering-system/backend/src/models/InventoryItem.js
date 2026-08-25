const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, required: true }, // e.g. "g", "ml", "pcs"
    quantityOnHand: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, default: 0 }, // triggers low-stock alert
    reorderQuantity: { type: Number, default: 0 }, // suggested restock amount
    costPerUnit: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
  },
  { timestamps: true }
);

// Audit trail for every stock movement (order deduction, restock, shift reconciliation)
const inventoryMovementSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    change: { type: Number, required: true }, // negative = deduction, positive = restock/adjustment
    reason: {
      type: String,
      enum: ['order_deduction', 'restock', 'shift_reconciliation', 'waste', 'manual_adjustment'],
      required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    note: { type: String, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);

module.exports = { InventoryItem, InventoryMovement };
