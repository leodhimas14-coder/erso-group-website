const mongoose = require('mongoose');

const wordSuggestionSchema = new mongoose.Schema(
  {
    wordOfDay: { type: mongoose.Schema.Types.ObjectId, ref: 'WordOfDay', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 60 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    votesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WordSuggestion', wordSuggestionSchema);
