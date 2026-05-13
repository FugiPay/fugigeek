const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    icon:        { type: String, default: '📁' },
    description: { type: String, trim: true, maxlength: 200 },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 }, // for display ordering
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
