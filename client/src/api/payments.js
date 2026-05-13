import api from './axios';

const paymentsAPI = {
  create:     orderId => api.post('/payments/create', { orderId }),
  getHistory: ()      => api.get('/payments/history'),
};

export default paymentsAPI;
