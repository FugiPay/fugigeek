const User         = require('../models/User');
const Task         = require('../models/Task');
const Order        = require('../models/Order');
const Review       = require('../models/Review');
const Category     = require('../models/Category');
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
  const { page = 1, limit = 20, role, search, status, deleteRequested } = req.query;

  const query = {};
  if (role)            query.role             = role;
  if (status)          query.isActive         = status === 'active';
  if (deleteRequested) query.deleteRequested  = true;
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
  const requester = req.user; // the admin or manager making the request

  const target = await User.findById(req.params.id);
  if (!target) { res.status(404); throw new Error('User not found'); }

  // Managers cannot change roles or touch other admins/managers
  if (requester.role === 'manager') {
    if (role !== undefined) {
      res.status(403); throw new Error('Managers cannot change user roles');
    }
    if (['admin', 'manager'].includes(target.role)) {
      res.status(403); throw new Error('Managers cannot modify admin or manager accounts');
    }
  }

  // Only admins can promote to admin or manager
  if (role && ['admin', 'manager'].includes(role) && requester.role !== 'admin') {
    res.status(403); throw new Error('Only admins can assign admin or manager roles');
  }

  // Cannot demote/modify another admin unless you are admin
  if (target.role === 'admin' && requester.role !== 'admin') {
    res.status(403); throw new Error('Cannot modify an admin account');
  }

  const updates = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role)                   updates.role     = role;
  if (verified !== undefined) {
    updates['businessProfile.verified']     = verified;
    updates['professionalProfile.verified'] = verified;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  ).select('-password');

  res.json({ success: true, user });
});

// ── @DELETE /api/admin/users/:id ─────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (['admin', 'manager'].includes(user.role)) {
    res.status(400); throw new Error('Cannot deactivate an admin or manager account');
  }
  if (req.user.role === 'manager' && ['admin', 'manager'].includes(user.role)) {
    res.status(403); throw new Error('Managers cannot deactivate admin or manager accounts');
  }
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'User deactivated' });
});

// ── @POST /api/admin/users/create-admin ──────────────────────────────────────
// Admin only — creates admin or manager accounts
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'manager' } = req.body;

  if (!['admin', 'manager'].includes(role)) {
    res.status(400); throw new Error('Role must be admin or manager');
  }
  // Only admins can create other admins
  if (role === 'admin' && req.user.role !== 'admin') {
    res.status(403); throw new Error('Only admins can create admin accounts');
  }
  if (await User.findOne({ email })) {
    res.status(400); throw new Error('Email already in use');
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created`,
    userId: user._id,
  });
});

// ── @DELETE /api/admin/users/:id/purge ───────────────────────────────────────
// Permanently delete a user — for admin processing of deletion requests
const purgeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(400); throw new Error('Cannot purge an admin account'); }

  // Anonymise rather than delete — preserves order/review integrity
  user.name              = 'Deleted User';
  user.email             = `deleted_${user._id}@fugigeek.com`;
  user.avatar            = '';
  user.phone             = '';
  user.isActive          = false;
  user.deleteRequested   = false;
  user.businessProfile   = {};
  user.professionalProfile = {};
  user.individualProfile = {};
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'User data purged. Records anonymised for compliance.' });
});
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
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('order name');

  // Attach task count to each category
  const stats = await Task.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  stats.forEach(s => { countMap[s._id] = s.count; });

  const result = categories.map(c => ({
    ...c.toObject(),
    taskCount: countMap[c.name] || 0,
  }));

  res.json({ success: true, categories: result });
});

// ── @POST /api/admin/categories ──────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, iconImg, iconKey, description, order } = req.body;
  if (!name) { res.status(400); throw new Error('Category name is required'); }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) { res.status(400); throw new Error('Category already exists'); }

  const category = await Category.create({
    name:        name.trim(),
    icon:        icon || '📁',
    iconImg:     iconImg || '',
    iconKey:     iconKey || '',
    description: description || '',
    order:       order || 0,
  });
  res.status(201).json({ success: true, category });
});

// ── @PUT /api/admin/categories/:id ───────────────────────────────────────────
const updateCategory = asyncHandler(async (req, res) => {
  const { name, icon, iconImg, iconKey, description, isActive, order } = req.body;
  const updates = {};
  if (name        !== undefined) updates.name        = name.trim();
  if (icon        !== undefined) updates.icon        = icon;
  if (iconImg     !== undefined) updates.iconImg     = iconImg;
  if (iconKey     !== undefined) updates.iconKey     = iconKey;
  if (description !== undefined) updates.description = description;
  if (isActive    !== undefined) updates.isActive    = isActive;
  if (order       !== undefined) updates.order       = Number(order);

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!category) { res.status(404); throw new Error('Category not found'); }
  res.json({ success: true, category });
});

// ── @DELETE /api/admin/categories/:id ────────────────────────────────────────
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error('Category not found'); }

  // Check if any tasks use this category
  const taskCount = await Task.countDocuments({ category: category.name });
  if (taskCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete — ${taskCount} task(s) use this category. Deactivate it instead.`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  getStats, getUsers, updateUser, deleteUser, createAdmin, purgeUser,
  getTasks, updateTask, deleteTask,
  getOrders, resolveOrder,
  getCategories, createCategory, updateCategory, deleteCategory,
};
