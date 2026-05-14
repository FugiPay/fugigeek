const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    task:         { type: mongoose.Schema.Types.ObjectId, ref: 'Task',     required: true },
    client:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true }, // renamed from business
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    proposal:     { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },

    // ── Agreed amount ─────────────────────────────────────────────────────────
    amount:   { type: Number, default: 0 },
    currency: { type: String, default: 'ZMW' },

    // ── Payment (MoneyUnify — MTN / Airtel / Zamtel) ────────────────────────
    payment: {
      transactionId: String,
      provider:      { type: String, default: 'moneyunify' },
      phone:         String,
      status:        { type: String, enum: ['initiated','otp-pending','successful','failed'], default: 'initiated' },
      initiatedAt:   Date,
      confirmedAt:   Date,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    // pending_payment → active → submitted → verified | disputed | cancelled
    // 'pending_payment' → order created, awaiting mobile money payment
    // 'active'          → payment confirmed, work in progress
    // 'submitted'       → professional submitted deliverables for review
    // 'verified'        → client confirmed work is done
    // 'disputed'        → client raised an issue
    // 'withdrawn'       → client withdrew before completion
    // 'cancelled'       → cancelled by either party or admin
    status: {
      type:    String,
      enum:    ['pending_payment', 'active', 'submitted', 'verified', 'disputed', 'withdrawn', 'cancelled'],
      default: 'pending_payment',
    },

    // ── Milestones ────────────────────────────────────────────────────────────
    milestones: [{
      title:       String,
      description: String,
      dueDate:     Date,
      status:      { type: String, enum: ['pending', 'submitted', 'verified'], default: 'pending' },
    }],

    // ── Deliverables submitted by professional ────────────────────────────────
    deliverables: [{
      url:          String,
      originalName: String,
      description:  String,
      uploadedAt:   { type: Date, default: Date.now },
    }],

    // ── Verification ─────────────────────────────────────────────────────────
    verifiedAt:        Date,
    verificationNotes: { type: String, maxlength: 1000 }, // client's sign-off note

    // ── Dates ─────────────────────────────────────────────────────────────────
    deadline:     Date,
    submittedAt:  Date,
    completedAt:  Date,

    // ── Notes ─────────────────────────────────────────────────────────────────
    clientNotes:       { type: String, maxlength: 1000 },
    professionalNotes: { type: String, maxlength: 1000 },
    disputeReason:     { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

orderSchema.index({ client: 1, status: 1 });
orderSchema.index({ professional: 1, status: 1 });
orderSchema.index({ task: 1 });

module.exports = mongoose.model('Order', orderSchema);
