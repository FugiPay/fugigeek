import api from './axios';

const paymentsAPI = {
  createIntent: orderId => api.post('/payments/create-intent', { orderId }),
  getHistory:   ()      => api.get('/payments/history'),
};

export default paymentsAPI;
