import api from './axios';

const paymentsAPI = {
  // Initiate USSD push to phone
  initiate:   (orderId, phone)  => api.post(`/payments/${orderId}/request`, { phone }),
  // Poll for payment status
  verify:     orderId           => api.get(`/payments/${orderId}/verify`),
  // Payment history
  getHistory: ()                => api.get('/payments/history'),
};

export default paymentsAPI;
