const mongoose = require('mongoose');
const { CATEGORY_SLUGS } = require('../constants/categories');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 280 },
    // Unset means the post only shows in the unfiltered "Lajmet e Fundit" view, not under any topic channel.
    category: { type: String, enum: CATEGORY_SLUGS, index: true },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
