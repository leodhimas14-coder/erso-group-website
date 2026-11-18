const mongoose = require('mongoose');

// Atomic sequence for human-friendly order numbers (PA-1001, PA-1002, ...).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const START = 1000;

counterSchema.statics.next = async function next(name) {
  const doc = await this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return START + doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
