const mongoose = require('mongoose');

/** Discussion comments under a "Fjala e Ditës" round - for opinions on the word/suggestions. */
const wordCommentSchema = new mongoose.Schema(
  {
    wordOfDay: { type: mongoose.Schema.Types.ObjectId, ref: 'WordOfDay', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 280 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WordComment', wordCommentSchema);
