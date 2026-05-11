import api from './axios';

const authAPI = {
  register:       data          => api.post('/auth/register', data),
  login:          data          => api.post('/auth/login', data),
  getMe:          ()            => api.get('/auth/me'),
  updateProfile:  data          => api.put('/auth/updateprofile', data),
  updatePassword: data          => api.put('/auth/updatepassword', data),
  forgotPassword: email         => api.post('/auth/forgotpassword', { email }),
  resetPassword:  (token, data) => api.put(`/auth/resetpassword/${token}`, data),
};

export default authAPI;
