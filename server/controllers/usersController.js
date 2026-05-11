const User         = require('../models/User');
const Review       = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

// @GET /api/users/professionals  — public directory of professionals
const getProfessionals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, skills, availability, minRate, maxRate, search, sort = '-stats.rating' } = req.query;

  const query = { role: 'professional', isActive: true };
  if (skills)       query['professionalProfile.skills'] = { $in: skills.split(',') };
  if (availability) query['professionalProfile.availability'] = availability;
  if (minRate)      query['professionalProfile.hourlyRate'] = { $gte: Number(minRate) };
  if (maxRate)      query['professionalProfile.hourlyRate'] = {
    ...(query['professionalProfile.hourlyRate'] || {}), $lte: Number(maxRate),
  };
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { 'professionalProfile.headline': { $regex: search, $options: 'i' } },
    { 'professionalProfile.skills':   { $regex: search, $options: 'i' } },
  ];

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const professionals = await User.find(query)
    .select('name avatar professionalProfile stats createdAt')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, count: professionals.length, total, pages: Math.ceil(total / limit), professionals });
});

// @GET /api/users/:id  — public profile
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -emailVerifyToken -resetPasswordToken -resetPasswordExpire');
  if (!user || !user.isActive) { res.status(404); throw new Error('User not found'); }

  const reviews = await Review.find({ reviewee: req.params.id })
    .populate('reviewer', 'name avatar')
    .sort('-createdAt')
    .limit(10);

  res.json({ success: true, user, reviews });
});

// @PUT /api/users/:id/deactivate  — admin only
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, message: 'User deactivated' });
});

module.exports = { getProfessionals, getUser, deactivateUser };
