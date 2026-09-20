const mongoose = require('mongoose');

/**
 * "Tema e Ditës" - a topic the admin pins to the top of everyone's feed,
 * broadcast in real time (the "ping"). Only one is active at a time; setting
 * a new one deactivates the previous one instead of deleting history.
 */
const dailyTopicSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyTopic', dailyTopicSchema);
