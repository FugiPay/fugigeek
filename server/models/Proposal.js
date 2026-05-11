const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    task:         { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Bid ──────────────────────────────────────────────────────────────────
    bidAmount:    { type: Number, required: [true, 'Bid amount is required'], min: 0 },
    bidType:      { type: String, enum: ['fixed', 'hourly'], required: true },
    currency:     { type: String, default: 'USD' },

    // ── Pitch ────────────────────────────────────────────────────────────────
    coverLetter:  { type: String, required: [true, 'Cover letter is required'], maxlength: 3000 },
    timeline:     { type: String, maxlength: 200 },
    attachments:  [{ url: String, originalName: String }],

    // ── Status lifecycle ─────────────────────────────────────────────────────
    // pending → accepted | rejected | withdrawn
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },

    // ── Messaging ────────────────────────────────────────────────────────────
    messages: [{
      sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content:   String,
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// One proposal per professional per task
proposalSchema.index({ task: 1, professional: 1 }, { unique: true });
proposalSchema.index({ professional: 1, status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
