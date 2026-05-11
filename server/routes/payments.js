const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createPaymentIntent, stripeWebhook, getPaymentHistory } = require('../controllers/paymentsController');

// Webhook must come before express.json() — raw body required
router.post('/webhook',        stripeWebhook);
router.post('/create-intent',  protect, createPaymentIntent);
router.get( '/history',        protect, getPaymentHistory);

module.exports = router;
