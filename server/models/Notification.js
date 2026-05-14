const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['new_proposal', 'proposal_accepted', 'order_submitted', 'order_verified',
             'new_message', 'payment_initiated', 'payment_confirmed', 'dispute_raised', 'order_cancelled'],
      required: true,
    },
    title:   { type: String, required: true },
    body:    { type: String, required: true },
    link:    { type: String }, // frontend route to navigate to
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
