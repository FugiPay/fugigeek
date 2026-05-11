const Review       = require('../models/Review');
const Order        = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// @POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
  const { orderId, rating, comment, criteria } = req.body;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.status !== 'completed') { res.status(400); throw new Error('Can only review completed orders'); }

  const isParty = [order.business.toString(), order.professional.toString()]
    .includes(req.user._id.toString());
  if (!isParty) { res.status(403); throw new Error('Not authorised to review this order'); }

  const reviewee = req.user._id.toString() === order.business.toString()
    ? order.professional
    : order.business;

  const review = await Review.create({
    order: orderId, task: order.task,
    reviewer: req.user._id, reviewee,
    rating, comment, criteria,
  });

  res.status(201).json({ success: true, review });
});

// @GET /api/reviews/user/:userId
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name avatar')
    .populate('task',     'title')
    .sort('-createdAt');
  res.json({ success: true, reviews });
});

module.exports = { createReview, getUserReviews };
