const express      = require('express');
const router       = express.Router();
const { protect }  = require('../middleware/auth');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @GET /api/notifications  — get current user's notifications
router.get('/', protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt')
    .limit(30);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ success: true, notifications, unread });
}));

// @PUT /api/notifications/read-all  — mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
}));

// @PUT /api/notifications/:id/read  — mark one as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.json({ success: true });
}));

module.exports = router;
