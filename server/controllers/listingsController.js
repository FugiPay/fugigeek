const Task              = require('../models/Task');
const Proposal          = require('../models/Proposal');
const User              = require('../models/User');
const asyncHandler      = require('../utils/asyncHandler');
const { deleteFromS3 }  = require('../config/s3');
const email             = require('../utils/email');
const notify            = require('../utils/notify');

// @GET /api/listings
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, category, status = 'open',
    budgetType, budgetMin, budgetMax, search, skills, sort = '-createdAt',
  } = req.query;

  const query = { isPublished: true };
  if (status)     query.status           = status;
  if (category)   query.category         = category;
  if (budgetType) query.budgetType       = budgetType;
  if (budgetMin)  query.budgetMax        = { $gte: Number(budgetMin) };
  if (budgetMax)  query.budgetMin        = { ...(query.budgetMin || {}), $lte: Number(budgetMax) };
  if (skills)     query.skillsRequired   = { $in: skills.split(',') };
  if (search)     query.$text            = { $search: search };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('postedBy', 'name avatar businessProfile.companyName individualProfile.occupation professionalProfile.headline stats.rating')
    .sort(sort).skip(skip).limit(Number(limit));

  res.json({ success: true, count: tasks.length, total, pages: Math.ceil(total / limit), tasks });
});

// @GET /api/listings/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('postedBy',   'name avatar businessProfile individualProfile professionalProfile stats phone')
    .populate('assignedTo', 'name avatar professionalProfile.headline stats');
  if (!task) { res.status(404); throw new Error('Task not found'); }
  task.views += 1;
  await task.save({ validateBeforeSave: false });
  res.json({ success: true, task });
});

// @POST /api/listings
const createTask = asyncHandler(async (req, res) => {
  req.body.postedBy = req.user._id;
  const task = await Task.create(req.body);
  res.status(201).json({ success: true, task });
});

// @PUT /api/listings/:id
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised to edit this task');
  }
  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, task });
});

// @DELETE /api/listings/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised to delete this task');
  }
  for (const att of (task.attachments || [])) {
    if (att.key) await deleteFromS3(att.key).catch(() => {});
  }
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});

// @POST /api/listings/:id/upload
const uploadAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }
  const files = req.files.map(f => ({ url: f.location, key: f.key, originalName: f.originalname }));
  task.attachments.push(...files);
  await task.save();
  res.json({ success: true, attachments: task.attachments });
});

// @GET /api/listings/:id/proposals
const getProposals = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }
  const proposals = await Proposal.find({ task: req.params.id })
    .populate('professional', 'name avatar professionalProfile stats phone');
  res.json({ success: true, proposals });
});

// @POST /api/listings/:id/proposals  — professional submits a proposal
const submitProposal = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (task.status !== 'open') {
    res.status(400); throw new Error('This task is no longer accepting proposals');
  }
  if (task.proposalCount >= task.maxProposals) {
    res.status(400); throw new Error('Maximum proposals reached for this task');
  }
  if (task.postedBy.toString() === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot submit a proposal on your own task');
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

  const io     = req.app.get('io');
  const poster = await User.findById(task.postedBy).select('name email');

  // ── Notify POSTER — new proposal received ──────────────────────────────
  if (poster) {
    email.sendNewProposal(poster.email, {
      posterName:       poster.name,
      professionalName: req.user.name,
      taskTitle:        task.title,
      taskId:           task._id,
    });
    notify(io, {
      recipient: task.postedBy,
      type:      'new_proposal',
      title:     'New proposal received 📬',
      body:      `${req.user.name} submitted a proposal on "${task.title}"`,
      link:      `/listings/${task._id}/proposals`,
    });
  }

  // ── Notify PROFESSIONAL — submission confirmed ─────────────────────────
  email.sendProposalSubmitted(req.user.email, {
    professionalName: req.user.name,
    taskTitle:        task.title,
    posterName:       poster?.name || 'the client',
    taskId:           task._id,
  });
  notify(io, {
    recipient: req.user._id,
    type:      'new_proposal',
    title:     'Proposal submitted ✅',
    body:      `Your proposal on "${task.title}" has been sent. You'll be notified when the client responds.`,
    link:      `/listings/${task._id}`,
  });

  res.status(201).json({ success: true, proposal });
});

// @PUT /api/listings/:taskId/proposals/:proposalId/accept
const acceptProposal = asyncHandler(async (req, res) => {
  const task     = await Task.findById(req.params.taskId);
  const proposal = await Proposal.findById(req.params.proposalId).populate('professional', 'name email');
  if (!task || !proposal) { res.status(404); throw new Error('Task or proposal not found'); }
  if (task.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  // Accept chosen, reject the rest
  const rejectedProposals = await Proposal.find({
    task:   task._id,
    _id:    { $ne: proposal._id },
    status: 'pending',
  }).populate('professional', 'name email');

  await Proposal.updateMany(
    { task: task._id, _id: { $ne: proposal._id } },
    { status: 'rejected' }
  );
  proposal.status = 'accepted';
  await proposal.save();

  task.status     = 'in-progress';
  task.assignedTo = proposal.professional._id;
  task.assignedAt = Date.now();
  await task.save();

  const io = req.app.get('io');

  // ── Notify POSTER — confirmation ───────────────────────────────────────
  notify(io, {
    recipient: task.postedBy,
    type:      'proposal_accepted',
    title:     'Proposal accepted ✅',
    body:      `You accepted ${proposal.professional.name}'s proposal on "${task.title}". An order will be created.`,
    link:      `/listings/${task._id}/proposals`,
  });

  // ── Notify rejected professionals ─────────────────────────────────────
  for (const rejected of rejectedProposals) {
    email.sendProposalRejected(rejected.professional.email, {
      professionalName: rejected.professional.name,
      taskTitle:        task.title,
    });
    notify(io, {
      recipient: rejected.professional._id,
      type:      'new_proposal',
      title:     'Proposal not selected',
      body:      `Another professional was selected for "${task.title}". Keep applying — more tasks are available!`,
      link:      `/listings`,
    });
  }

  res.json({ success: true, proposal, task });
});

// @GET /api/listings/my/tasks
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ postedBy: req.user._id }).sort('-createdAt');
  res.json({ success: true, tasks });
});

module.exports = {
  getTasks, getTask, createTask, updateTask, deleteTask,
  uploadAttachments, getProposals, submitProposal, acceptProposal, getMyTasks,
};
