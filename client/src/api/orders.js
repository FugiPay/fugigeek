import api from './axios';

const ordersAPI = {
  create:   data       => api.post('/orders', data),
  getAll:   params     => api.get('/orders', { params }),
  getOne:   id         => api.get(`/orders/${id}`),
  submit:   (id, data) => api.put(`/orders/${id}/submit`, data),
  verify:   (id, data) => api.put(`/orders/${id}/verify`, data),
  dispute:  (id, data) => api.put(`/orders/${id}/dispute`, data),
  withdraw: id         => api.put(`/orders/${id}/withdraw`),
};

export default ordersAPI;