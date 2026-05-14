const Order        = require('../models/Order');
const Task         = require('../models/Task');
const Proposal     = require('../models/Proposal');
const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const email        = require('../utils/email');
const notify       = require('../utils/notify');

// @POST /api/orders — created when client accepts a proposal
const createOrder = asyncHandler(async (req, res) => {
  const { taskId, proposalId } = req.body;

  const task     = await Task.findById(taskId);
  const proposal = await Proposal.findById(proposalId).populate('professional', 'name email');
  if (!task || !proposal) { res.status(404); throw new Error('Task or proposal not found'); }

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

  const io = req.app.get('io');

  // ── Notify PROFESSIONAL — proposal accepted, order created ────────────
  email.sendProposalAccepted(proposal.professional.email, {
    professionalName: proposal.professional.name,
    taskTitle:        task.title,
    orderId:          order._id,
  });
  notify(io, {
    recipient: proposal.professional._id,
    type:      'proposal_accepted',
    title:     'Your proposal was accepted! 🎉',
    body:      `Your proposal on "${task.title}" was accepted. An order has been created — check it now.`,
    link:      `/orders/${order._id}`,
  });

  // ── Notify CLIENT — order created confirmation ─────────────────────────
  notify(io, {
    recipient: req.user._id,
    type:      'proposal_accepted',
    title:     'Order created 📦',
    body:      `Your order with ${proposal.professional.name} for "${task.title}" is ready. Complete payment to get started.`,
    link:      `/orders/${order._id}`,
  });

  res.status(201).json({ success: true, order });
});

// @GET /api/orders
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

// @PUT /api/orders/:id/submit — professional submits deliverables
const submitOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.professional.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the assigned professional can submit');
  }
  if (order.status !== 'active') {
    res.status(400); throw new Error('Order is not active');
  }

  if (req.body.deliverables)      order.deliverables.push(...req.body.deliverables);
  if (req.body.professionalNotes) order.professionalNotes = req.body.professionalNotes;
  order.status      = 'submitted';
  order.submittedAt = Date.now();
  await order.save();

  const io     = req.app.get('io');
  const client = await User.findById(order.client).select('name email');
  const task   = await Task.findById(order.task).select('title');

  // ── Notify CLIENT — work submitted for review ─────────────────────────
  if (client && task) {
    email.sendWorkSubmitted(client.email, {
      clientName:       client.name,
      professionalName: req.user.name,
      taskTitle:        task.title,
      orderId:          order._id,
    });
    notify(io, {
      recipient: order.client,
      type:      'order_submitted',
      title:     'Work submitted for review 📋',
      body:      `${req.user.name} has submitted work on "${task.title}". Please review and verify.`,
      link:      `/orders/${order._id}`,
    });
  }

  // ── Notify PROFESSIONAL — submission confirmed ─────────────────────────
  notify(io, {
    recipient: order.professional,
    type:      'order_submitted',
    title:     'Work submitted ✅',
    body:      `Your work on "${task?.title}" has been submitted. Awaiting client verification.`,
    link:      `/orders/${order._id}`,
  });

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/verify — client verifies work
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

  await Task.findByIdAndUpdate(order.task, { status: 'completed', completedAt: Date.now() });
  await User.findByIdAndUpdate(order.professional, { $inc: { 'stats.completedTasks': 1 } });
  await User.findByIdAndUpdate(order.client,       { $inc: { 'stats.completedTasks': 1 } });

  const io           = req.app.get('io');
  const professional = await User.findById(order.professional).select('name email');
  const taskDoc      = await Task.findById(order.task).select('title');

  // ── Notify PROFESSIONAL — work verified, job complete ─────────────────
  if (professional && taskDoc) {
    email.sendWorkVerified(professional.email, {
      professionalName: professional.name,
      taskTitle:        taskDoc.title,
      orderId:          order._id,
    });
    notify(io, {
      recipient: order.professional,
      type:      'order_verified',
      title:     'Work verified! 🎉',
      body:      `The client verified your work on "${taskDoc.title}". Great job! Consider asking for a review.`,
      link:      `/orders/${order._id}`,
    });
  }

  // ── Notify CLIENT — completion confirmation ───────────────────────────
  notify(io, {
    recipient: order.client,
    type:      'order_verified',
    title:     'Order complete ✅',
    body:      `You've verified the work on "${taskDoc?.title}". The order is now complete.`,
    link:      `/orders/${order._id}`,
  });

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

  const io      = req.app.get('io');
  const task    = await Task.findById(order.task).select('title');
  const isClient = order.client.toString() === req.user._id.toString();
  const otherParty = isClient ? order.professional : order.client;

  // ── Notify OTHER PARTY — dispute raised ───────────────────────────────
  notify(io, {
    recipient: otherParty,
    type:      'dispute_raised',
    title:     'Dispute raised ⚠️',
    body:      `A dispute has been raised on the order for "${task?.title}". Our team will review it shortly.`,
    link:      `/orders/${order._id}`,
  });

  // ── Notify DISPUTING PARTY — confirmation ────────────────────────────
  notify(io, {
    recipient: req.user._id,
    type:      'dispute_raised',
    title:     'Dispute submitted ⚠️',
    body:      `Your dispute on "${task?.title}" has been submitted. Our team will be in touch shortly.`,
    link:      `/orders/${order._id}`,
  });

  res.json({ success: true, order });
});

// @PUT /api/orders/:id/withdraw — client withdraws order
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

  await Task.findByIdAndUpdate(order.task, { status: 'open', assignedTo: null });

  const io   = req.app.get('io');
  const task = await Task.findById(order.task).select('title');

  // ── Notify PROFESSIONAL — order withdrawn ─────────────────────────────
  notify(io, {
    recipient: order.professional,
    type:      'order_cancelled',
    title:     'Order withdrawn',
    body:      `The client has withdrawn the order for "${task?.title}". The task is now open again.`,
    link:      `/listings`,
  });

  // ── Notify CLIENT — withdrawal confirmation ───────────────────────────
  notify(io, {
    recipient: order.client,
    type:      'order_cancelled',
    title:     'Order withdrawn',
    body:      `You have withdrawn the order for "${task?.title}". The task is now open for new proposals.`,
    link:      `/listings/${order.task}`,
  });

  res.json({ success: true, order });
});

module.exports = { createOrder, getOrders, getOrder, submitOrder, verifyOrder, disputeOrder, withdrawOrder };
