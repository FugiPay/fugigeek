const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    task:         { type: mongoose.Schema.Types.ObjectId, ref: 'Task',  required: true },
    reviewer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    reviewee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1500 },

    // Detailed ratings
    criteria: {
      communication: { type: Number, min: 1, max: 5 },
      quality:       { type: Number, min: 1, max: 5 },
      timeliness:    { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },
  },
  { timestamps: true }
);

// One review per order per reviewer
reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

// After save: update reviewee's average rating in User model
reviewSchema.post('save', async function () {
  const User   = require('./User');
  const Review = this.constructor;
  const agg    = await Review.aggregate([
    { $match: { reviewee: this.reviewee } },
    { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg.length) {
    await User.findByIdAndUpdate(this.reviewee, {
      'stats.rating':      Math.round(agg[0].avg * 10) / 10,
      'stats.reviewCount': agg[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
