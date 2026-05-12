const { Conversation, Message } = require('../models/Message');
const asyncHandler              = require('../utils/asyncHandler');

// ── @GET /api/messages/conversations ─────────────────────────────────────────
// Get all conversations for the current user
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar role businessProfile.companyName professionalProfile.headline')
    .populate('task', 'title')
    .sort('-lastMessageAt');

  res.json({ success: true, conversations });
});

// ── @POST /api/messages/conversations ────────────────────────────────────────
// Start or retrieve a conversation with another user (optionally linked to a task)
const startConversation = asyncHandler(async (req, res) => {
  const { recipientId, taskId } = req.body;

  if (recipientId === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot message yourself');
  }

  // Check if conversation already exists between these two users
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    ...(taskId ? { task: taskId } : {}),
  }).populate('participants', 'name avatar role businessProfile.companyName professionalProfile.headline')
    .populate('task', 'title');

  if (!conversation) {
    conversation = await Conversation.create({
      participants:  [req.user._id, recipientId],
      task:          taskId || null,
      unreadCount:   { [req.user._id]: 0, [recipientId]: 0 },
    });
    conversation = await conversation.populate([
      { path: 'participants', select: 'name avatar role businessProfile.companyName professionalProfile.headline' },
      { path: 'task',         select: 'title' },
    ]);
  }

  res.status(201).json({ success: true, conversation });
});

// ── @GET /api/messages/conversations/:id ─────────────────────────────────────
// Get messages in a conversation (paginated)
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }

  const isParticipant = conversation.participants
    .map(p => p.toString())
    .includes(req.user._id.toString());
  if (!isParticipant) { res.status(403); throw new Error('Not authorised'); }

  const skip     = (Number(page) - 1) * Number(limit);
  const total    = await Message.countDocuments({ conversation: req.params.id });
  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'name avatar')
    .sort('createdAt')
    .skip(skip)
    .limit(Number(limit));

  // Mark all messages as read for this user
  await Message.updateMany(
    { conversation: req.params.id, sender: { $ne: req.user._id }, read: false },
    { read: true }
  );

  // Reset unread count for this user
  await Conversation.findByIdAndUpdate(req.params.id, {
    $set: { [`unreadCount.${req.user._id}`]: 0 },
  });

  res.json({ success: true, messages, total, pages: Math.ceil(total / limit) });
});

// ── @POST /api/messages/conversations/:id ────────────────────────────────────
// Send a message in a conversation
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }

  const isParticipant = conversation.participants
    .map(p => p.toString())
    .includes(req.user._id.toString());
  if (!isParticipant) { res.status(403); throw new Error('Not authorised'); }

  const message = await Message.create({
    conversation: req.params.id,
    sender:       req.user._id,
    content,
  });

  await message.populate('sender', 'name avatar');

  // Update conversation metadata
  const recipient = conversation.participants.find(
    p => p.toString() !== req.user._id.toString()
  );
  await Conversation.findByIdAndUpdate(req.params.id, {
    lastMessage:   content,
    lastMessageAt: Date.now(),
    $inc: { [`unreadCount.${recipient}`]: 1 },
  });

  // Emit real-time event to recipient via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(recipient.toString()).emit('new_message', {
      conversationId: req.params.id,
      message,
    });
  }

  res.status(201).json({ success: true, message });
});

// ── @GET /api/messages/unread ─────────────────────────────────────────────────
// Get total unread message count for the current user
const getUnreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id });
  const total = conversations.reduce((sum, c) => {
    return sum + (c.unreadCount?.get(req.user._id.toString()) || 0);
  }, 0);
  res.json({ success: true, unread: total });
});

module.exports = { getConversations, startConversation, getMessages, sendMessage, getUnreadCount };
