const mongoose = require('mongoose');

// ── Conversation ─────────────────────────────────────────────────────────────
// A conversation is between exactly two users (business ↔ professional)
// Optionally linked to a task for context
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    task:         { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    lastMessage:  { type: String, default: '' },
    lastMessageAt:{ type: Date,   default: Date.now },
    unreadCount:  {
      type: Map,
      of:   Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// ── Message ───────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
    content:      { type: String, required: [true, 'Message cannot be empty'], maxlength: 2000 },
    read:         { type: Boolean, default: false },
    attachments:  [{ url: String, key: String, originalName: String }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message      = mongoose.model('Message',      messageSchema);

module.exports = { Conversation, Message };
