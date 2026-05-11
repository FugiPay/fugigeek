import api from './axios';

const ordersAPI = {
  create:   data          => api.post('/orders', data),
  getAll:   params        => api.get('/orders', { params }),
  getOne:   id            => api.get(`/orders/${id}`),
  submit:   (id, data)    => api.put(`/orders/${id}/submit`, data),
  complete: id            => api.put(`/orders/${id}/complete`),
  dispute:  (id, data)    => api.put(`/orders/${id}/dispute`, data),
};

export default ordersAPI;
