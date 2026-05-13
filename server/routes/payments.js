const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPayment,
  verifyPayment,
  cancelPayment,
  getPaymentHistory,
} = require('../controllers/paymentsController');

// DPO redirects to /verify and /cancel — no auth header, verified via CompanyRef
router.get( '/verify',  verifyPayment);
router.get( '/cancel',  cancelPayment);

// Protected
router.post('/create',  protect, createPayment);
router.get( '/history', protect, getPaymentHistory);

module.exports = router;
