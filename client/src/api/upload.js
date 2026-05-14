import api from './axios';

const uploadAPI = {
  avatar: file => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  portfolioImage: file => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload/portfolio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePortfolioImage: key => api.delete('/upload/portfolio', { data: { key } }),
};

export default uploadAPI;
