const mongoose = require('mongoose');

const ROLES = ['admin', 'cashier', 'kitchen', 'kiosk'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'kiosk' },
    active: { type: Boolean, default: true },
    pin: { type: String }, // short PIN for fast in-store cashier/kitchen login
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.pin;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
