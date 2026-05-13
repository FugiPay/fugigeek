const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder, getOrders, getOrder,
  submitOrder, verifyOrder, disputeOrder, withdrawOrder,
} = require('../controllers/ordersController');

router.post('/',               protect, createOrder);
router.get( '/',               protect, getOrders);
router.get( '/:id',            protect, getOrder);
router.put( '/:id/submit',     protect, submitOrder);
router.put( '/:id/verify',     protect, verifyOrder);
router.put( '/:id/dispute',    protect, disputeOrder);
router.put( '/:id/withdraw',   protect, withdrawOrder);

module.exports = router;