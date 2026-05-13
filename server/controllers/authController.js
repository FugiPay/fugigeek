const crypto        = require('crypto');
const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler  = require('../utils/asyncHandler');
const email         = require('../utils/email');

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({ success: true, token, user: user.toPublicJSON() });
};

// @POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, businessProfile, professionalProfile } = req.body;

  if (!['individual', 'business', 'professional'].includes(role)) {
    res.status(400); throw new Error('Role must be individual, business or professional');
  }
  if (await User.findOne({ email })) {
    res.status(400); throw new Error('An account with this email already exists');
  }

  const userData = { name, email, password, role, phone: phone || '' };
  if (role === 'individual'   && req.body.individualProfile)   userData.individualProfile   = req.body.individualProfile;
  if (role === 'business'     && businessProfile)              userData.businessProfile     = businessProfile;
  if (role === 'professional' && professionalProfile)          userData.professionalProfile = professionalProfile;

  const user = await User.create(userData);
  email.sendWelcome(user.email, { name: user.name, role: user.role });
  sendToken(user, 201, res);
});

// @POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Please provide email and password'); }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!user.isActive) { res.status(403); throw new Error('Account deactivated. Contact support.'); }

  user.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res);
});

// @GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toPublicJSON() });
});

// @PUT /api/auth/updateprofile
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'phone', 'individualProfile', 'businessProfile', 'professionalProfile'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, user: user.toPublicJSON() });
});

// @PUT /api/auth/updatepassword
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

// @POST /api/auth/forgotpassword
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    email.sendPasswordReset(user.email, { name: user.name, resetUrl });
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// @PUT /api/auth/resetpassword/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user   = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) { res.status(400); throw new Error('Invalid or expired reset token'); }
  user.password            = req.body.password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

module.exports = { register, login, getMe, updateProfile, updatePassword, forgotPassword, resetPassword };
