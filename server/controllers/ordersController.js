const Order        = require('../models/Order');
const Task         = require('../models/Task');
const Proposal     = require('../models/Proposal');
const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const email        = require('../utils/email');
const notify       = require('../utils/notify');

// @POST /api/orders  — created when client accepts a proposal
const createOrder = asyncHandler(async (req, res) => {
  const { taskId, proposalId } = req.body;

  const task     = await Task.findById(taskId);
  const proposal = await Proposal.findById(proposalId).populate('professional');
  if (!task || !proposal) { res.status(404); throw new Error('Task or proposal not found'); }

  // Allow individual, business, professional, or admin to create orders
  const isClient = task.postedBy?.toString() === req.user._id.toString();

  if (!isClient && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }

  const order = await Order.create({
    task:         taskId,
    client:       req.user._id,
    professional: proposal.professional._id,
    proposal:     proposalId,
    amount:       proposal.bidAmount || 0,
    currency:     'ZMW',
    deadline:     task.deadline,
  });

  // Email professional that proposal was accepted
  email.sendProposalAccepted(proposal.professional.email, {
    professionalName: proposal.professional.name,
    taskTitle:        task.title,
    orderId:          order._id,
  });

  // In-app notification
  const io = req.app.get('io');
  notify(io, {
    recipient: proposal.professional._id,
    type:      'proposal_accepted',
    title:     'Your proposal was accepted! 🎉',
    body:      `Your proposal on "${task.title}" has been accepted. Check your order.`,
    link:      `/orders/${order._id}`,
  });

  res.status(201).json({ success: true, order });
});

// @GET /api/orders  — returns orders for current user
const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = req.user.role === 'professional'
    ? { professional: req.user._id }
    : { client:       req.user._id };
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate('task',         'title category')
    .populate('client',       'name avatar businessProfile.companyName individualProfile.occupation')
    .populate('professional', 'name avatar professionalProfile.headline')
    .sort('-createdAt');

  res.json({ success: true, orders });
});

// @GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('task')
    .populate('client',       'name avatar businessProfile individualProfile phone')
    .populate('professional', 'name avatar professionalProfile phone')
    .populate('proposal');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isParty = [order.client._id.toString(), order.professional._id.toString()]
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
  if (order.status !== 'active') {
    res.status(400); throw new Error('Order is not active');
  }

  if (req.body.deliverables)       order.deliverables.push(...req.body.deliverables);
  if (req.body.professionalNotes)  order.professionalNotes = req.body.professionalNotes;
  order.status      = 'submitted';
  order.submittedAt = Date.now();
  await order.save();

  // Notify client via socket and email
  const io = req.app.get('io');
  if (io) io.to(order.client.toString()).emit('order_submitted', { orderId: order._id });

  const client = await User.findById(order.client).select('name email');
  const task   = await Task.findById(order.task).select('title');
  if (client && task) {
    email.sendWorkSubmitted(client.email, {
      clientName:       client.name,
      professionalName: req.user.name,
      taskTitle:        task.title,
      orderId:          order._id,
    });
  }

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/verify  — client verifies the work is done
const verifyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the client can verify completion');
  }
  if (order.status !== 'submitted') {
    res.status(400); throw new Error('Work has not been submitted yet');
  }

  order.status            = 'verified';
  order.verifiedAt        = Date.now();
  order.completedAt       = Date.now();
  order.verificationNotes = req.body.verificationNotes || '';
  await order.save();

  // Update task status
  await Task.findByIdAndUpdate(order.task, { status: 'completed', completedAt: Date.now() });

  // Update stats
  await User.findByIdAndUpdate(order.professional, {
    $inc: { 'stats.completedTasks': 1 },
  });
  await User.findByIdAndUpdate(order.client, {
    $inc: { 'stats.completedTasks': 1 },
  });

  // Notify professional via socket and email
  const io = req.app.get('io');
  if (io) io.to(order.professional.toString()).emit('order_verified', { orderId: order._id });

  const professional = await User.findById(order.professional).select('name email');
  const taskDoc      = await Task.findById(order.task).select('title');
  if (professional && taskDoc) {
    email.sendWorkVerified(professional.email, {
      professionalName: professional.name,
      taskTitle:        taskDoc.title,
      orderId:          order._id,
    });
  }

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/dispute
const disputeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isParty = [order.client.toString(), order.professional.toString()]
    .includes(req.user._id.toString());
  if (!isParty) { res.status(403); throw new Error('Not authorised'); }
  if (!['active', 'submitted'].includes(order.status)) {
    res.status(400); throw new Error('Cannot dispute an order in this state');
  }

  order.status        = 'disputed';
  order.disputeReason = req.body.reason || '';
  await order.save();

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/withdraw  — client withdraws before work is verified
const withdrawOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the client can withdraw');
  }
  if (!['active'].includes(order.status)) {
    res.status(400); throw new Error('Can only withdraw an active order');
  }

  order.status = 'withdrawn';
  await order.save();

  // Reopen the task
  await Task.findByIdAndUpdate(order.task, { status: 'open', assignedTo: null });

  res.json({ success: true, order });
});

module.exports = { createOrder, getOrders, getOrder, submitOrder, verifyOrder, disputeOrder, withdrawOrder };
