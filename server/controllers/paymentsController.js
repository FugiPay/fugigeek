const Order        = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { requestPayment, verifyPayment } = require('../utils/moneyunify');
const email        = require('../utils/email');
const notify       = require('../utils/notify');

// ── @POST /api/payments/:id/request ─────────────────────────────────────────
// Sends a USSD push to the client's phone
const initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client',       'name email phone')
    .populate('professional', 'name email')
    .populate('task',         'title');

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.client._id.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }
  if (order.status !== 'pending_payment') {
    res.status(400); throw new Error(`Order is already ${order.status}`);
  }

  const phone = req.body.phone || order.client.phone;
  if (!phone) { res.status(400); throw new Error('Phone number required to initiate payment'); }

  try {
    const result = await requestPayment({ phone, amount: order.amount, reference: order._id.toString() });

    order.payment = {
      transactionId: result.transaction_id,
      provider:      'moneyunify',
      phone,
      status:        result.status,
      initiatedAt:   new Date(),
    };
    await order.save();

    const io = req.app.get('io');
    email.sendPaymentInitiated(order.client.email, {
      clientName: order.client.name,
      taskTitle:  order.task.title,
      amount:     order.amount,
    });
    notify(io, {
      recipient: order.client._id,
      type:      'payment_initiated',
      title:     'Payment initiated 💳',
      body:      `Check your phone for a K${order.amount} payment prompt. Approve it to activate your order.`,
      link:      `/orders/${order._id}`,
    });

    res.json({
      success:       true,
      message:       'Payment initiated. Check your phone for the USSD prompt.',
      transactionId: result.transaction_id,
      status:        result.status,
    });
  } catch (err) {
    console.error('MoneyUnify initiate error:', err.message);
    res.status(502); throw new Error(err.message || 'Payment request failed. Please try again.');
  }
});

// ── @GET /api/payments/:id/verify ────────────────────────────────────────────
// Poll this after the customer approves on their phone
const checkPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client',       'name email')
    .populate('professional', 'name email')
    .populate('task',         'title');

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.client._id.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  if (order.status === 'active') {
    return res.json({ success: true, status: 'successful', order });
  }

  const transactionId = order.payment?.transactionId;
  if (!transactionId) { res.status(400); throw new Error('No transaction found for this order'); }

  try {
    const result = await verifyPayment(transactionId);

    if (result.status === 'successful') {
      order.status              = 'active';
      order.payment.status      = 'successful';
      order.payment.confirmedAt = new Date();
      await order.save();

      const io = req.app.get('io');
      [
        { user: order.client,       msg: `Your payment of K${order.amount} for "${order.task.title}" is confirmed. Work can begin.` },
        { user: order.professional, msg: `Payment of K${order.amount} for "${order.task.title}" confirmed. You can start work.` },
      ].forEach(({ user, msg }) => {
        email.sendPaymentConfirmed(user.email, { name: user.name, taskTitle: order.task.title, amount: order.amount, orderId: order._id });
        notify(io, { recipient: user._id, type: 'payment_confirmed', title: 'Payment confirmed ✅', body: msg, link: `/orders/${order._id}` });
      });
    } else if (result.status === 'failed') {
      order.payment.status = 'failed';
      await order.save();
    }

    res.json({ success: true, status: result.status, order });
  } catch (err) {
    console.error('MoneyUnify verify error:', err.message);
    res.status(502); throw new Error('Could not verify payment. Please try again.');
  }
});

// ── @GET /api/payments/history ────────────────────────────────────────────────
const getHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id, 'payment.status': 'successful' })
    .populate('task', 'title category')
    .populate('professional', 'name')
    .sort('-payment.confirmedAt');
  res.json({ success: true, orders });
});

module.exports = { initiatePayment, checkPayment, getHistory };
