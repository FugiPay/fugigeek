const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    task:         { type: mongoose.Schema.Types.ObjectId, ref: 'Task',     required: true },
    business:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    proposal:     { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },

    // ── Financials ───────────────────────────────────────────────────────────
    amount:       { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'USD' },
    platformFee:  { type: Number, default: 0 },   // e.g. 10% of amount
    netPayout:    { type: Number, default: 0 },   // amount - platformFee

    // ── Stripe ───────────────────────────────────────────────────────────────
    stripePaymentIntentId: { type: String },
    stripeTransferId:      { type: String },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    // pending_payment → active → submitted → completed | disputed | refunded
    status: {
      type:    String,
      enum:    ['pending_payment', 'active', 'submitted', 'completed', 'disputed', 'refunded', 'cancelled'],
      default: 'pending_payment',
    },

    // ── Milestones ────────────────────────────────────────────────────────────
    milestones: [{
      title:       String,
      description: String,
      dueDate:     Date,
      amount:      Number,
      status:      { type: String, enum: ['pending', 'completed', 'approved'], default: 'pending' },
    }],

    // ── Deliverables ──────────────────────────────────────────────────────────
    deliverables: [{
      url:          String,
      originalName: String,
      uploadedAt:   { type: Date, default: Date.now },
    }],

    // ── Dates ─────────────────────────────────────────────────────────────────
    deadline:     Date,
    submittedAt:  Date,
    completedAt:  Date,

    // ── Notes ─────────────────────────────────────────────────────────────────
    businessNotes:     { type: String, maxlength: 1000 },
    professionalNotes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

orderSchema.index({ business: 1, status: 1 });
orderSchema.index({ professional: 1, status: 1 });
orderSchema.index({ task: 1 });

module.exports = mongoose.model('Order', orderSchema);
