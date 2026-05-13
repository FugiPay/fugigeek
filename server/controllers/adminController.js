const User         = require('../models/User');
const Task         = require('../models/Task');
const Order        = require('../models/Order');
const Review       = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const bcrypt       = require('bcryptjs');

// ── @GET /api/admin/stats ────────────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalProfessionals, totalBusinesses, totalIndividuals,
    totalTasks, openTasks, completedTasks,
    totalOrders, activeOrders, disputedOrders,
    totalReviews, avgRating,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'professional', isActive: true }),
    User.countDocuments({ role: 'business',     isActive: true }),
    User.countDocuments({ role: 'individual',   isActive: true }),
    Task.countDocuments(),
    Task.countDocuments({ status: 'open' }),
    Task.countDocuments({ status: 'completed' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'active' }),
    Order.countDocuments({ status: 'disputed' }),
    Review.countDocuments(),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
  ]);

  res.json({
    success: true,
    stats: {
      users:   { total: totalUsers, professionals: totalProfessionals, businesses: totalBusinesses, individuals: totalIndividuals },
      tasks:   { total: totalTasks, open: openTasks, completed: completedTasks },
      orders:  { total: totalOrders, active: activeOrders, disputed: disputedOrders },
      reviews: { total: totalReviews, avgRating: avgRating[0]?.avg?.toFixed(1) || 0 },
    },
  });
});

// ── @GET /api/admin/users ────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;

  const query = {};
  if (role)   query.role     = role;
  if (status) query.isActive = status === 'active';
  if (search) query.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
});

// ── @PUT /api/admin/users/:id ────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role, verified } = req.body;
  const updates = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role)                   updates.role     = role;
  if (verified !== undefined) {
    // verified applies to the relevant profile
    updates['businessProfile.verified']     = verified;
    updates['professionalProfile.verified'] = verified;
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
});

// ── @DELETE /api/admin/users/:id ─────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(400); throw new Error('Cannot delete an admin account'); }
  // Soft delete
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'User deactivated' });
});

// ── @POST /api/admin/users/create-admin ──────────────────────────────────────
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) {
    res.status(400); throw new Error('Email already in use');
  }
  const user = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ success: true, message: 'Admin account created', userId: user._id });
});

// ── @GET /api/admin/tasks ────────────────────────────────────────────────────
const getTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category, search } = req.query;

  const query = {};
  if (status)   query.status   = status;
  if (category) query.category = category;
  if (search)   query.$text    = { $search: search };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('postedBy', 'name email role')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, tasks, total, pages: Math.ceil(total / limit) });
});

// ── @PUT /api/admin/tasks/:id ────────────────────────────────────────────────
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json({ success: true, task });
});

// ── @DELETE /api/admin/tasks/:id ─────────────────────────────────────────────
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json({ success: true, message: 'Task deleted' });
});

// ── @GET /api/admin/orders ───────────────────────────────────────────────────
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('task',         'title category')
    .populate('client',       'name email')
    .populate('professional', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

// ── @PUT /api/admin/orders/:id/resolve ───────────────────────────────────────
// Admin resolves a disputed order
const resolveOrder = asyncHandler(async (req, res) => {
  const { resolution, notes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.status !== 'disputed') { res.status(400); throw new Error('Order is not disputed'); }

  // resolution: 'verified' (favour client — work accepted) or 'cancelled' (favour professional — work rejected)
  order.status            = resolution === 'verified' ? 'verified' : 'cancelled';
  order.verificationNotes = notes || `Resolved by admin: ${resolution}`;
  if (resolution === 'verified') {
    order.verifiedAt  = Date.now();
    order.completedAt = Date.now();
    await Task.findByIdAndUpdate(order.task, { status: 'completed' });
  }
  await order.save();
  res.json({ success: true, order });
});

// ── @GET /api/admin/categories ───────────────────────────────────────────────
// Returns category usage stats from tasks collection
const getCategories = asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
  ]);
  res.json({ success: true, categories: stats });
});

module.exports = {
  getStats, getUsers, updateUser, deleteUser, createAdmin,
  getTasks, updateTask, deleteTask,
  getOrders, resolveOrder,
  getCategories,
};
