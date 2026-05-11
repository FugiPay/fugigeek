const stripe       = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order        = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// @POST /api/payments/create-intent  — create Stripe PaymentIntent for an order
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.business.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  const intent = await stripe.paymentIntents.create({
    amount:   Math.round(order.amount * 100), // cents
    currency: order.currency.toLowerCase(),
    metadata: { orderId: order._id.toString(), businessId: req.user._id.toString() },
  });

  order.stripePaymentIntentId = intent.id;
  await order.save({ validateBeforeSave: false });

  res.json({ success: true, clientSecret: intent.client_secret });
});

// @POST /api/payments/webhook  — Stripe webhook (raw body, no auth middleware)
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order  = await Order.findOne({ stripePaymentIntentId: intent.id });
    if (order && order.status === 'pending_payment') {
      order.status = 'active';
      await order.save({ validateBeforeSave: false });
    }
  }

  res.json({ received: true });
};

// @GET /api/payments/history  — user's payment history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'business'
    ? { business: req.user._id }
    : { professional: req.user._id };

  const orders = await Order.find({ ...filter, status: { $in: ['active', 'completed'] } })
    .populate('task', 'title')
    .select('amount currency platformFee netPayout status createdAt')
    .sort('-createdAt');

  res.json({ success: true, payments: orders });
});

module.exports = { createPaymentIntent, stripeWebhook, getPaymentHistory };
