const mongoose = require('mongoose');

// A shopper's account. They sign up with an email or a phone number (or both).
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true }, // stored as +3556XXXXXXXX
    passwordHash: { type: String, required: true },
    // Remembered from the last order so the next checkout is pre-filled.
    address: {
      city: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
customerSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

customerSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Customer', customerSchema);
