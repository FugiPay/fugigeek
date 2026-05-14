const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { deleteFromS3 } = require('../config/s3');

// ── @POST /api/upload/avatar ──────────────────────────────────────────────────
// Upload profile picture — replaces existing
const uploadAvatar = asyncHandler(async (req, res) => {
  console.log('=== UPLOAD AVATAR ===');
  console.log('req.file:', JSON.stringify(req.file, null, 2));

  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const user = await User.findById(req.user._id);

  if (user.avatarKey) {
    await deleteFromS3(user.avatarKey).catch(err => console.log('S3 delete error:', err.message));
  }

  // Build public URL — works whether or not location is set by multer-s3
  const avatarUrl = req.file.location ||
    `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;

  user.avatar    = avatarUrl;
  user.avatarKey = req.file.key;
  await user.save({ validateBeforeSave: false });

  console.log('Saved avatar URL:', user.avatar);
  res.json({ success: true, avatar: user.avatar });
});

// ── @POST /api/upload/portfolio ───────────────────────────────────────────────
// Upload a portfolio image — returns URL to store in professionalProfile.portfolio
const uploadPortfolioImage = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  res.json({
    success: true,
    url:     req.file.location,
    key:     req.file.key,
    name:    req.file.originalname,
  });
});

// ── @DELETE /api/upload/portfolio ─────────────────────────────────────────────
// Delete a portfolio image from S3 by key
const deletePortfolioImage = asyncHandler(async (req, res) => {
  const { key } = req.body;
  if (!key) { res.status(400); throw new Error('No key provided'); }
  await deleteFromS3(key);
  res.json({ success: true });
});

module.exports = { uploadAvatar, uploadPortfolioImage, deletePortfolioImage };
