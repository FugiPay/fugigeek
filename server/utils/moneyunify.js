// MoneyUnify — Zambia mobile money payments
// Supports MTN, Airtel, and Zamtel
// Sign up at https://moneyunify.one to get your auth_id
// Docs: https://apidog.com/apidoc/shared-c8a1fbbb-8410-4978-8a64-937fc55186da

const axios = require('axios');

const MONEYUNIFY_URL = 'https://api.moneyunify.one';

// ── Request payment from customer ────────────────────────────────────────────
// Sends a USSD push to the customer's phone. They approve on their handset.
const requestPayment = async ({ phone, amount, reference }) => {
  const params = new URLSearchParams({
    from_payer: phone.replace(/\D/g, ''), // digits only e.g. 0971234567
    amount:     String(amount),
    auth_id:    process.env.MONEYUNIFY_AUTH_ID,
    // Optional: add a note visible to the payer
    note:       `Fugigeek order - ${reference}`,
  });

  const { data } = await axios.post(
    `${MONEYUNIFY_URL}/payments/request`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } }
  );

  // Response: { message, isError, data: { status, amount, transaction_id, charges, from_payer } }
  if (data.isError) throw new Error(data.message || 'Payment request failed');
  return data.data; // { transaction_id, status, amount, charges }
};

// ── Verify payment status ────────────────────────────────────────────────────
const verifyPayment = async (transactionId) => {
  const params = new URLSearchParams({
    transaction_id: transactionId,
    auth_id:        process.env.MONEYUNIFY_AUTH_ID,
  });

  const { data } = await axios.post(
    `${MONEYUNIFY_URL}/payments/verify`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } }
  );

  if (data.isError) throw new Error(data.message || 'Verification failed');
  return data.data; // { status: 'successful' | 'failed' | 'pending' | 'initiated', ... }
};

module.exports = { requestPayment, verifyPayment };
