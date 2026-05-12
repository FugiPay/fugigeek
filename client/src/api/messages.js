import api from './axios';

const messagesAPI = {
  getConversations:  ()                    => api.get('/messages/conversations'),
  startConversation: (recipientId, taskId) => api.post('/messages/conversations', { recipientId, taskId }),
  getMessages:       (convId, page)        => api.get(`/messages/conversations/${convId}`, { params: { page } }),
  sendMessage:       (convId, content)     => api.post(`/messages/conversations/${convId}`, { content }),
  getUnreadCount:    ()                    => api.get('/messages/unread'),
};

export default messagesAPI;
