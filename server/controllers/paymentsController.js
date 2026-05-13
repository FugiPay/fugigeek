const Order        = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const dpo          = require('../utils/dpo');
const email        = require('../utils/email');

// ── @POST /api/payments/create ────────────────────────────────────────────────
const createPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId)
    .populate('client',       'name email phone')
    .populate('professional', 'name email')
    .populate('task',         'title');

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.client._id.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }
  if (order.payment?.status === 'paid') {
    res.status(400); throw new Error('Order has already been paid');
  }

  const nameParts = order.client.name.split(' ');

  const { transToken, transRef, paymentUrl } = await dpo.createTransaction({
    amount:            order.amount,
    orderId:           order._id,
    taskTitle:         order.task.title,
    customerEmail:     order.client.email,
    customerFirstName: nameParts[0],
    customerLastName:  nameParts.slice(1).join(' ') || nameParts[0],
    customerPhone:     order.client.phone || '',
  });

  order.payment = { status: 'pending', dpoToken: transToken, transRef };
  await order.save({ validateBeforeSave: false });

  email.sendPaymentInitiated(order.client.email, {
    clientName: order.client.name,
    taskTitle:  order.task.title,
    amount:     order.amount,
    transRef,
  });

  res.json({ success: true, paymentUrl, transRef });
});

// ── @GET /api/payments/verify ─────────────────────────────────────────────────
// DPO redirects here after payment attempt
const verifyPayment = asyncHandler(async (req, res) => {
  const { TransID, CompanyRef } = req.query;

  const order = await Order.findOne({ 'payment.transRef': CompanyRef })
    .populate('client',       'name email')
    .populate('professional', 'name email')
    .populate('task',         'title');

  if (!order) {
    return res.redirect(`${process.env.CLIENT_URL}/payment/cancel?error=order_not_found`);
  }

  const result = await dpo.verifyTransaction(order.payment.dpoToken);

  if (result.success) {
    order.payment.status = 'paid';
    order.payment.dpoRef = result.transactionRef || TransID;
    order.payment.paidAt = Date.now();
    order.status         = 'active';
    await order.save({ validateBeforeSave: false });

    // Email both parties
    [
      { user: order.client,       name: order.client.name },
      { user: order.professional, name: order.professional.name },
    ].forEach(({ user, name }) => {
      email.sendPaymentConfirmed(user.email, {
        name,
        taskTitle: order.task.title,
        amount:    order.amount,
        orderId:   order._id,
      });
    });

    const io = req.app.get('io');
    if (io) io.to(order.professional._id.toString()).emit('payment_confirmed', { orderId: order._id });

    return res.redirect(`${process.env.CLIENT_URL}/payment/success?orderId=${order._id}`);
  }

  order.payment.status        = 'failed';
  order.payment.failureReason = result.resultExpl;
  await order.save({ validateBeforeSave: false });

  return res.redirect(`${process.env.CLIENT_URL}/payment/cancel?error=${encodeURIComponent(result.resultExpl)}&orderId=${order._id}`);
});

// ── @GET /api/payments/cancel ─────────────────────────────────────────────────
const cancelPayment = asyncHandler(async (req, res) => {
  const { CompanyRef } = req.query;
  if (CompanyRef) {
    await Order.findOneAndUpdate(
      { 'payment.transRef': CompanyRef },
      { 'payment.status': 'failed', 'payment.failureReason': 'Cancelled by user' }
    );
  }
  res.redirect(`${process.env.CLIENT_URL}/payment/cancel?reason=cancelled`);
});

// ── @GET /api/payments/history ────────────────────────────────────────────────
const getPaymentHistory = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'professional'
    ? { professional: req.user._id }
    : { client:       req.user._id };

  const orders = await Order.find({ ...filter, 'payment.status': { $in: ['paid', 'pending'] } })
    .populate('task', 'title')
    .select('amount currency payment status createdAt task')
    .sort('-createdAt');

  res.json({ success: true, payments: orders });
});

module.exports = { createPayment, verifyPayment, cancelPayment, getPaymentHistory };
