const Task              = require('../models/Task');
const Proposal          = require('../models/Proposal');
const User              = require('../models/User');
const asyncHandler      = require('../utils/asyncHandler');
const { deleteFromS3 }  = require('../config/s3');
const email             = require('../utils/email');
const notify            = require('../utils/notify');

// @GET /api/listings  — public, filterable, paginated
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, category, status = 'open',
    budgetType, budgetMin, budgetMax, search, skills, sort = '-createdAt',
  } = req.query;

  const query = { isPublished: true };
  if (status)    query.status   = status;
  if (category)  query.category = category;
  if (budgetType) query.budgetType = budgetType;
  if (budgetMin)  query.budgetMax  = { $gte: Number(budgetMin) };
  if (budgetMax)  query.budgetMin  = { ...(query.budgetMin || {}), $lte: Number(budgetMax) };
  if (skills)     query.skillsRequired = { $in: skills.split(',') };
  if (search)     query.$text = { $search: search };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('postedBy', 'name avatar businessProfile.companyName businessProfile.verified stats.rating')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, count: tasks.length, total, pages: Math.ceil(total / limit), tasks });
});

// @GET /api/listings/:id  — public
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('postedBy',   'name avatar businessProfile stats')
    .populate('assignedTo', 'name avatar professionalProfile.headline stats');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  task.views += 1;
  await task.save({ validateBeforeSave: false });
  res.json({ success: true, task });
});

// @POST /api/listings  — business only
const createTask = asyncHandler(async (req, res) => {
  req.body.postedBy = req.user._id;
  const task = await Task.create(req.body);
  res.status(201).json({ success: true, task });
});

// @PUT /api/listings/:id  — owner only
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised to edit this task');
  }
  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, task });
});

// @DELETE /api/listings/:id  — owner or admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised to delete this task');
  }
  // Remove attachments from S3
  for (const att of task.attachments) {
    if (att.key) await deleteFromS3(att.key);
  }
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});

// @POST /api/listings/:id/upload  — business owner uploads attachments
const uploadAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }
  const files = req.files.map(f => ({
    url:          f.location,     // S3 public URL
    key:          f.key,          // S3 object key (for deletion)
    originalName: f.originalname,
  }));
  task.attachments.push(...files);
  await task.save();
  res.json({ success: true, attachments: task.attachments });
});

// @GET /api/listings/:id/proposals  — business owner sees proposals for their task
const getProposals = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }
  const proposals = await Proposal.find({ task: req.params.id })
    .populate('professional', 'name avatar professionalProfile stats');
  res.json({ success: true, proposals });
});

// @POST /api/listings/:id/proposals  — professional submits a proposal
const submitProposal = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.status !== 'open') { res.status(400); throw new Error('This task is no longer accepting proposals'); }
  if (task.proposalCount >= task.maxProposals) {
    res.status(400); throw new Error('Maximum proposals reached for this task');
  }

  const existing = await Proposal.findOne({ task: req.params.id, professional: req.user._id });
  if (existing) { res.status(400); throw new Error('You have already submitted a proposal for this task'); }

  const proposal = await Proposal.create({
    ...req.body,
    task:         req.params.id,
    professional: req.user._id,
  });

  task.proposalCount += 1;
  await task.save({ validateBeforeSave: false });

  // Notify task poster via socket and email
  const io = req.app.get('io');
  if (io) io.to(task.postedBy.toString()).emit('new_proposal', { taskId: task._id, proposalId: proposal._id });

  // Email the poster
  const poster = await User.findById(task.postedBy).select('name email');
  if (poster) {
    email.sendNewProposal(poster.email, {
      posterName:       poster.name,
      professionalName: req.user.name,
      taskTitle:        task.title,
      taskId:           task._id,
    });
  }

  // In-app notification
  notify(io, {
    recipient: task.postedBy,
    type:      'new_proposal',
    title:     'New proposal received',
    body:      `${req.user.name} submitted a proposal on "${task.title}"`,
    link:      `/listings/${task._id}/proposals`,
  });

  res.status(201).json({ success: true, proposal });
});

// @PUT /api/listings/:taskId/proposals/:proposalId/accept  — business accepts a proposal
const acceptProposal = asyncHandler(async (req, res) => {
  const task     = await Task.findById(req.params.taskId);
  const proposal = await Proposal.findById(req.params.proposalId);
  if (!task || !proposal) { res.status(404); throw new Error('Task or proposal not found'); }
  if (task.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  // Accept chosen proposal, reject the rest
  await Proposal.updateMany({ task: task._id, _id: { $ne: proposal._id } }, { status: 'rejected' });
  proposal.status = 'accepted';
  await proposal.save();

  task.status     = 'in-progress';
  task.assignedTo = proposal.professional;
  task.assignedAt = Date.now();
  await task.save();

  res.json({ success: true, proposal, task });
});

// @GET /api/listings/my/tasks
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ postedBy: req.user._id }).sort('-createdAt');
  res.json({ success: true, tasks });
});

// @PUT /api/listings/:id/cancel — soft cancel, keeps record in DB
const cancelTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }
  if (['completed', 'cancelled'].includes(task.status)) {
    res.status(400); throw new Error(`Task is already ${task.status}`);
  }
  task.status       = 'cancelled';
  task.cancelReason = req.body.reason || '';
  await task.save();

  // Notify any professionals with pending proposals
  const Proposal = require('../models/Proposal');
  const pending   = await Proposal.find({ task: task._id, status: 'pending' })
    .populate('professional', 'name email');
  const io = req.app.get('io');
  for (const p of pending) {
    notify(io, {
      recipient: p.professional._id,
      type:      'order_cancelled',
      title:     'Task cancelled',
      body:      `The task "${task.title}" has been cancelled by the poster.`,
      link:      `/listings`,
    });
  }
  await Proposal.updateMany({ task: task._id, status: 'pending' }, { status: 'rejected' });

  res.json({ success: true, message: 'Task cancelled', task });
});

module.exports = {
  getTasks, getTask, createTask, updateTask, deleteTask, cancelTask,
  uploadAttachments, getProposals, submitProposal, acceptProposal, getMyTasks,
};
