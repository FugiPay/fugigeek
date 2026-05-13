const axios = require('axios');
const crypto = require('crypto');

const DPO_API_URL     = process.env.DPO_API_URL     || 'https://secure.3gdirectpay.com/API/v6/';
const DPO_PAYMENT_URL = process.env.DPO_PAYMENT_URL || 'https://secure.3gdirectpay.com/payv2.php';
const COMPANY_TOKEN   = process.env.DPO_COMPANY_TOKEN;
const SERVICE_TYPE    = process.env.DPO_SERVICE_TYPE;
const CLIENT_URL      = process.env.CLIENT_URL || 'https://fugigeek-b7afc.web.app';

// ── Create a DPO transaction ─────────────────────────────────────────────────
// Returns { transToken, paymentUrl } on success
const createTransaction = async ({ amount, orderId, taskTitle, customerEmail, customerFirstName, customerLastName, customerPhone }) => {
  if (!COMPANY_TOKEN || !SERVICE_TYPE) {
    throw new Error('DPO credentials not configured');
  }

  // Generate a unique internal reference
  const transRef = `FG-${orderId}-${Date.now()}`;

  const backUrl    = `${CLIENT_URL}/payment/success?ref=${transRef}`;
  const cancelUrl  = `${CLIENT_URL}/payment/cancel?ref=${transRef}`;
  const redirectUrl = `${process.env.SERVER_URL || 'https://fugigeek.onrender.com'}/api/payments/verify`;

  // DPO API uses XML
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${COMPANY_TOKEN}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${Number(amount).toFixed(2)}</PaymentAmount>
    <PaymentCurrency>ZMW</PaymentCurrency>
    <CompanyRef>${transRef}</CompanyRef>
    <RedirectURL>${redirectUrl}</RedirectURL>
    <BackURL>${backUrl}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>24</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${SERVICE_TYPE}</ServiceType>
      <ServiceDescription>${taskTitle}</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().slice(0, 8)}</ServiceDate>
    </Service>
  </Services>
  ${customerEmail ? `
  <CustomerDetails>
    <CustomerFirstName>${customerFirstName || 'Customer'}</CustomerFirstName>
    <CustomerLastName>${customerLastName || ''}</CustomerLastName>
    <CustomerAddress>Zambia</CustomerAddress>
    <CustomerCity>Lusaka</CustomerCity>
    <CustomerZip>10101</CustomerZip>
    <CustomerCountry>ZM</CustomerCountry>
    <CustomerPhone>${customerPhone || ''}</CustomerPhone>
    <CustomerEmail>${customerEmail}</CustomerEmail>
  </CustomerDetails>` : ''}
</API3G>`;

  const response = await axios.post(DPO_API_URL, xml, {
    headers: { 'Content-Type': 'application/xml' },
  });

  const body = response.data;

  // Parse XML response (simple string extraction — avoids xml parser dependency)
  const getTag = (tag) => {
    const match = body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1] : null;
  };

  const resultCode = getTag('Result');
  const resultExpl = getTag('ResultExplanation');
  const transToken = getTag('TransToken');

  if (resultCode !== '000') {
    throw new Error(`DPO Error ${resultCode}: ${resultExpl}`);
  }

  return {
    transToken,
    transRef,
    paymentUrl: `${DPO_PAYMENT_URL}?ID=${transToken}`,
  };
};

// ── Verify a DPO transaction ─────────────────────────────────────────────────
// Call after DPO redirects back to confirm payment
const verifyTransaction = async (transToken) => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`;

  const response = await axios.post(DPO_API_URL, xml, {
    headers: { 'Content-Type': 'application/xml' },
  });

  const body = response.data;
  const getTag = (tag) => {
    const match = body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1] : null;
  };

  const resultCode     = getTag('Result');
  const resultExpl     = getTag('ResultExplanation');
  const transactionRef = getTag('TransactionRef');
  const amount         = getTag('TransactionAmount');
  const currency       = getTag('TransactionCurrency');
  const customerEmail  = getTag('CustomerEmail');

  return {
    success:        resultCode === '000',
    resultCode,
    resultExpl,
    transactionRef,
    amount,
    currency,
    customerEmail,
  };
};

module.exports = { createTransaction, verifyTransaction };
