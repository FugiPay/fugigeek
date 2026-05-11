import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('tb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
