const mongoose = require('mongoose');

const orderItemOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
    choiceName: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nameSnapshot: { type: String, required: true }, // preserve name even if product later renamed
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // basePrice + selected option deltas
    options: [orderItemOptionSchema],
    notes: { type: String, default: '' },
    // Kitchen prep status per line item, so KDS can tick items off individually
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'ready'],
      default: 'queued',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // human-readable, e.g. daily sequence
    channel: { type: String, enum: ['kiosk', 'website', 'cashier'], required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        'pending_payment', // cart submitted, awaiting payment
        'paid', // payment confirmed, sent to kitchen
        'preparing',
        'ready', // all items ready for pickup/serving
        'completed', // handed to customer
        'cancelled',
      ],
      default: 'pending_payment',
      index: true,
    },

    payment: {
      method: { type: String, enum: ['stripe_card', 'cash', 'terminal'], default: 'stripe_card' },
      stripePaymentIntentId: { type: String },
      paidAt: { type: Date },
    },

    // Albanian fiscalization (fature.al) receipt reference
    fiscalization: {
      status: { type: String, enum: ['not_required', 'pending', 'issued', 'failed'], default: 'pending' },
      fiscalReceiptId: { type: String },
      fiscalUrl: { type: String },
      issuedAt: { type: Date },
      error: { type: String },
    },

    customerName: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // cashier/kiosk operator, if any
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
