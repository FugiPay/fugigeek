const { Resend } = require('resend');

const FROM     = process.env.RESEND_FROM_EMAIL || 'noreply@fugigeek.com';
const BASE_URL = process.env.CLIENT_URL        || 'https://fugigeek-b7afc.web.app';

// Lazy init — only instantiate when actually sending so missing key doesn't crash startup
let _resend = null;
const getResend = () => {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

// ── Generic send ─────────────────────────────────────────────────────────────
const send = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email skipped — no RESEND_API_KEY] To: ${to} | ${subject}`);
    return;
  }
  try {
    const result = await getResend().emails.send({
      from: `Fugigeek <${FROM}>`,
      to,
      subject,
      html,
    });
    return result;
  } catch (err) {
    console.error('Resend error:', err.message);
  }
};

// ── Base HTML wrapper ─────────────────────────────────────────────────────────
const wrap = body => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
    <div style="background:#2563eb;padding:20px 28px;">
      <span style="color:#fff;font-size:20px;font-weight:800;">Fugigeek</span>
    </div>
    <div style="padding:32px 28px;color:#111827;">
      ${body}
    </div>
    <div style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
      Fugigeek &middot; Connecting people with professionals in Zambia<br>
      <a href="${BASE_URL}" style="color:#2563eb;text-decoration:none;">Visit Fugigeek</a>
    </div>
  </div>
</body>
</html>`;

const btn  = (text, url, bg = '#2563eb') =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;background:${bg};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${text}</a>`;
const h2   = t => `<h2 style="font-size:20px;font-weight:700;margin:0 0 10px;">${t}</h2>`;
const para = t => `<p style="color:#4b5563;line-height:1.7;margin:0 0 12px;">${t}</p>`;

// ── Exported send functions ───────────────────────────────────────────────────
module.exports = {

  sendWelcome: (to, { name, role }) => send({
    to,
    subject: `Welcome to Fugigeek, ${name}!`,
    html: wrap(`
      ${h2(`Welcome aboard, ${name}! 🎉`)}
      ${para(`Your <strong>${role}</strong> account is ready. Here is what you can do next:`)}
      ${role === 'professional'
        ? `<ul style="color:#374151;line-height:2;padding-left:20px;">
             <li>Complete your profile to attract more clients</li>
             <li>Browse open tasks and submit proposals</li>
             <li>Add your phone number so clients can reach you directly</li>
           </ul>`
        : `<ul style="color:#374151;line-height:2;padding-left:20px;">
             <li>Post your first task — it is free</li>
             <li>Browse professionals by skill or category</li>
             <li>Communicate via messages or phone</li>
           </ul>`
      }
      ${btn('Get started', BASE_URL)}
    `),
  }),

  sendNewProposal: (to, { posterName, professionalName, taskTitle, taskId }) => send({
    to,
    subject: `New proposal on "${taskTitle}"`,
    html: wrap(`
      ${h2('You have a new proposal 📬')}
      ${para(`Hi ${posterName}, <strong>${professionalName}</strong> submitted a proposal for your task <strong>"${taskTitle}"</strong>.`)}
      ${btn('View proposal', `${BASE_URL}/listings/${taskId}/proposals`)}
    `),
  }),

  sendProposalAccepted: (to, { professionalName, taskTitle, orderId }) => send({
    to,
    subject: `Your proposal was accepted — "${taskTitle}"`,
    html: wrap(`
      ${h2('Proposal accepted! 🎉')}
      ${para(`Hi ${professionalName}, your proposal for <strong>"${taskTitle}"</strong> was accepted. You can now start working.`)}
      ${btn('View order', `${BASE_URL}/orders/${orderId}`, '#16a34a')}
    `),
  }),

  sendWorkSubmitted: (to, { clientName, professionalName, taskTitle, orderId }) => send({
    to,
    subject: `Work submitted for review — "${taskTitle}"`,
    html: wrap(`
      ${h2('Work submitted for your review 📋')}
      ${para(`Hi ${clientName}, <strong>${professionalName}</strong> submitted work on <strong>"${taskTitle}"</strong>. Please review and verify or raise a dispute.`)}
      ${btn('Review work', `${BASE_URL}/orders/${orderId}`)}
    `),
  }),

  sendWorkVerified: (to, { professionalName, taskTitle, orderId }) => send({
    to,
    subject: `Work verified — "${taskTitle}"`,
    html: wrap(`
      ${h2('Work verified! ✅')}
      ${para(`Hi ${professionalName}, the client verified your work on <strong>"${taskTitle}"</strong>. The task is now complete.`)}
      ${para('Consider asking your client for a review to strengthen your profile.')}
      ${btn('View order', `${BASE_URL}/orders/${orderId}`, '#16a34a')}
    `),
  }),

  sendPaymentInitiated: (to, { clientName, taskTitle, amount, transRef }) => send({
    to,
    subject: `Payment initiated — "${taskTitle}"`,
    html: wrap(`
      ${h2('Payment in progress 💳')}
      ${para(`Hi ${clientName}, your payment of <strong>K${amount}</strong> for <strong>"${taskTitle}"</strong> has been initiated.`)}
      ${para(`Transaction reference: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">${transRef}</code>`)}
      ${para('Once confirmed, the professional will be notified to begin work.')}
    `),
  }),

  sendPaymentConfirmed: (to, { name, taskTitle, amount, orderId }) => send({
    to,
    subject: `Payment confirmed — "${taskTitle}"`,
    html: wrap(`
      ${h2('Payment confirmed ✅')}
      ${para(`Hi ${name}, your payment of <strong>K${amount}</strong> for <strong>"${taskTitle}"</strong> has been confirmed.`)}
      ${btn('View order', `${BASE_URL}/orders/${orderId}`, '#16a34a')}
    `),
  }),

  sendNewMessage: (to, { recipientName, senderName, conversationId }) => send({
    to,
    subject: `New message from ${senderName}`,
    html: wrap(`
      ${h2('You have a new message 💬')}
      ${para(`Hi ${recipientName}, <strong>${senderName}</strong> sent you a message on Fugigeek.`)}
      ${btn('Read message', `${BASE_URL}/messages?conv=${conversationId}`)}
    `),
  }),

  sendPasswordReset: (to, { name, resetUrl }) => send({
    to,
    subject: 'Reset your Fugigeek password',
    html: wrap(`
      ${h2('Reset your password 🔑')}
      ${para(`Hi ${name}, we received a request to reset your password. This link expires in 30 minutes.`)}
      ${btn('Reset password', resetUrl)}
      ${para('<span style="font-size:13px;color:#9ca3af;">If you did not request this, you can safely ignore this email.</span>')}
    `),
  }),
};
