const mongoose = require('mongoose');
const { SHIPMENT_STATUSES, keys } = require('../config/constants');

// One cargo consolidation from the China warehouse to Albania.
const shipmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: keys(SHIPMENT_STATUSES), default: 'ne_pergatitje' },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    weightKg: { type: Number, min: 0, default: 0 },
    cargoCostAll: { type: Number, min: 0, default: 0 },
    departedAt: Date,
    arrivedAt: Date,
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
