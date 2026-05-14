const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { initiatePayment, checkPayment, getHistory } = require('../controllers/paymentsController');

router.post('/:id/request', protect, initiatePayment);  // initiate USSD push
router.get( '/:id/verify',  protect, checkPayment);     // poll for status
router.get( '/history',     protect, getHistory);

module.exports = router;
