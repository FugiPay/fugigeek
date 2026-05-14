import api from './axios';

const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default categoriesAPI;
