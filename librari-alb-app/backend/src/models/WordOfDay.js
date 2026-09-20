const mongoose = require('mongoose');

/**
 * "Fjala e Ditës" - a word (often an everyday loanword) the admin posts for
 * users to propose a more genuinely Albanian alternative for, then vote on.
 * Only one is active at a time; setting a new one deactivates the previous
 * one instead of deleting it, so past rounds stay visible in history.
 */
const wordOfDaySchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, maxlength: 60 },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WordOfDay', wordOfDaySchema);
