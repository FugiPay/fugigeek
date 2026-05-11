const Order        = require('../models/Order');
const Task         = require('../models/Task');
const Proposal     = require('../models/Proposal');
const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const PLATFORM_FEE_PCT = 0.10; // 10%

// @POST /api/orders  — created after business accepts proposal & pays
const createOrder = asyncHandler(async (req, res) => {
  const { taskId, proposalId } = req.body;

  const task     = await Task.findById(taskId);
  const proposal = await Proposal.findById(proposalId).populate('professional');
  if (!task || !proposal) { res.status(404); throw new Error('Task or proposal not found'); }
  if (task.business.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  const platformFee = Math.round(proposal.bidAmount * PLATFORM_FEE_PCT * 100) / 100;
  const netPayout   = proposal.bidAmount - platformFee;

  const order = await Order.create({
    task:         taskId,
    business:     req.user._id,
    professional: proposal.professional._id,
    proposal:     proposalId,
    amount:       proposal.bidAmount,
    currency:     proposal.currency,
    platformFee,
    netPayout,
    deadline:     task.deadline,
  });

  res.status(201).json({ success: true, order });
});

// @GET /api/orders  — returns orders relevant to the current user
const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = req.user.role === 'business'
    ? { business:     req.user._id }
    : { professional: req.user._id };
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate('task',         'title category')
    .populate('business',     'name avatar businessProfile.companyName')
    .populate('professional', 'name avatar professionalProfile.headline')
    .sort('-createdAt');

  res.json({ success: true, orders });
});

// @GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('task')
    .populate('business',     'name avatar businessProfile')
    .populate('professional', 'name avatar professionalProfile')
    .populate('proposal');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isParty = [order.business._id.toString(), order.professional._id.toString()]
    .includes(req.user._id.toString());
  if (!isParty && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/submit  — professional submits deliverables
const submitOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.professional.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the assigned professional can submit');
  }
  if (order.status !== 'active') { res.status(400); throw new Error('Order is not active'); }

  if (req.body.deliverables) order.deliverables.push(...req.body.deliverables);
  if (req.body.professionalNotes) order.professionalNotes = req.body.professionalNotes;
  order.status      = 'submitted';
  order.submittedAt = Date.now();
  await order.save();

  // Notify business
  const io = req.app.get('io');
  if (io) io.to(order.business.toString()).emit('order_submitted', { orderId: order._id });

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/complete  — business approves & releases payment
const completeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.business.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the business can mark the order complete');
  }
  if (order.status !== 'submitted') { res.status(400); throw new Error('Order has not been submitted yet'); }

  order.status      = 'completed';
  order.completedAt = Date.now();
  await order.save();

  // Update stats
  await Task.findByIdAndUpdate(order.task, { status: 'completed', completedAt: Date.now() });
  await User.findByIdAndUpdate(order.professional, {
    $inc: { 'stats.completedTasks': 1, 'stats.totalEarnings': order.netPayout },
  });
  await User.findByIdAndUpdate(order.business, {
    $inc: { 'stats.completedTasks': 1, 'stats.totalSpent': order.amount },
  });

  const io = req.app.get('io');
  if (io) io.to(order.professional.toString()).emit('order_completed', { orderId: order._id });

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/dispute
const disputeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  const isParty = [order.business.toString(), order.professional.toString()]
    .includes(req.user._id.toString());
  if (!isParty) { res.status(403); throw new Error('Not authorised'); }

  order.status = 'disputed';
  if (req.body.reason) order.businessNotes = req.body.reason;
  await order.save();
  res.json({ success: true, order });
});

module.exports = { createOrder, getOrders, getOrder, submitOrder, completeOrder, disputeOrder };
