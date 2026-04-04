const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q:          { type: String, required: true, trim: true },
  o:          { type: [String], required: true, validate: v => v.length === 4 },
  c:          { type: Number, required: true, min: 0, max: 3 },
  cat:        { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  active:     { type: Boolean, default: true },
  version:    { type: Number, default: 1 },
}, { timestamps: true });

questionSchema.index({ cat: 1, active: 1 });
questionSchema.index({ difficulty: 1, active: 1 });
questionSchema.index({ updatedAt: 1 });

module.exports = mongoose.model('Question', questionSchema);
