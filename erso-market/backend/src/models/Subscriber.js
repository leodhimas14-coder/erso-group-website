const mongoose = require('mongoose');

// People who signed up in the footer to hear about new collections and offers.
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    consent: { type: Boolean, required: true }, // ticked the marketing-consent box
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
