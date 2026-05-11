import api from './axios';

const listingsAPI = {
  getAll:         params        => api.get('/listings', { params }),
  getOne:         id            => api.get(`/listings/${id}`),
  create:         data          => api.post('/listings', data),
  update:         (id, data)    => api.put(`/listings/${id}`, data),
  remove:         id            => api.delete(`/listings/${id}`),
  upload:         (id, files)   => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post(`/listings/${id}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getMyTasks:     ()            => api.get('/listings/my/tasks'),
  getProposals:   id            => api.get(`/listings/${id}/proposals`),
  submitProposal: (id, data)    => api.post(`/listings/${id}/proposals`, data),
  acceptProposal: (taskId, proposalId) => api.put(`/listings/${taskId}/proposals/${proposalId}/accept`),
};

export default listingsAPI;
