import api from './axios';

const usersAPI = {
  getProfessionals: params => api.get('/users/professionals', { params }),
  getOne:           id     => api.get(`/users/${id}`),
  deactivate:       id     => api.put(`/users/${id}/deactivate`),
  createReview:     data   => api.post('/reviews', data),
  getUserReviews:   userId => api.get(`/reviews/user/${userId}`),
};

export default usersAPI;
