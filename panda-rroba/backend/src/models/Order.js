const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_METHODS, keys } = require('../config/constants');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    // true when the item ships from Albania stock, false when it has to be bought in China.
    fromLocalStock: { type: Boolean, default: false },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      note: { type: String, trim: true, default: '' },
    },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: keys(PAYMENT_METHODS), default: 'card' },
    paid: { type: Boolean, default: false },
    payment: {
      provider: { type: String, default: '' },
      reference: { type: String, default: '' },
      paidAt: Date,
    },
    status: { type: String, enum: keys(ORDER_STATUSES), default: 'e_re' },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: String, default: '' },
        note: { type: String, default: '' },
      },
    ],
    // Filled in by staff: what the goods actually cost, for the profit report.
    costs: {
      purchaseCny: { type: Number, min: 0, default: 0 },
      cargoAll: { type: Number, min: 0, default: 0 },
      deliveryAll: { type: Number, min: 0, default: 0 },
    },
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    courierTracking: { type: String, trim: true, default: '' },
    internalNote: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'payment.reference': 1 }, { sparse: true });

// What the customer is allowed to see on the tracking page.
orderSchema.methods.toTracking = function toTracking() {
  return {
    number: this.number,
    status: this.status,
    statusHistory: this.statusHistory.map(({ status, at }) => ({ status, at })),
    items: this.items.map(({ name, image, size, color, quantity, unitPrice }) => ({
      name, image, size, color, quantity, unitPrice,
    })),
    subtotal: this.subtotal,
    shippingFee: this.shippingFee,
    total: this.total,
    paymentMethod: this.paymentMethod,
    paid: this.paid,
    city: this.customer.city,
    courierTracking: this.courierTracking,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Order', orderSchema);
