import api from './axios';

const adminAPI = {
  getStats:      ()                  => api.get('/admin/stats'),
  getUsers:      params              => api.get('/admin/users', { params }),
  updateUser:    (id, data)          => api.put(`/admin/users/${id}`, data),
  deleteUser:    id                  => api.delete(`/admin/users/${id}`),
  createAdmin:   data                => api.post('/admin/users/create-admin', data),
  getTasks:      params              => api.get('/admin/tasks', { params }),
  updateTask:    (id, data)          => api.put(`/admin/tasks/${id}`, data),
  deleteTask:    id                  => api.delete(`/admin/tasks/${id}`),
  getOrders:     params              => api.get('/admin/orders', { params }),
  resolveOrder:  (id, data)          => api.put(`/admin/orders/${id}/resolve`, data),
  getCategories: ()                  => api.get('/admin/categories'),
};

export default adminAPI;
