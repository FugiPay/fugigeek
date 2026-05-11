const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createOrder, getOrders, getOrder, submitOrder, completeOrder, disputeOrder } = require('../controllers/ordersController');

router.post('/',               protect, authorize('business'),      createOrder);
router.get( '/',               protect,                             getOrders);
router.get( '/:id',            protect,                             getOrder);
router.put( '/:id/submit',     protect, authorize('professional'),  submitOrder);
router.put( '/:id/complete',   protect, authorize('business'),      completeOrder);
router.put( '/:id/dispute',    protect,                             disputeOrder);

module.exports = router;
