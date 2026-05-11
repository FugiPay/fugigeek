const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getUserReviews } = require('../controllers/reviewsController');

router.post('/',               protect, createReview);
router.get( '/user/:userId',            getUserReviews);

module.exports = router;
