import api from './api';

const aiService = {
  sendMessage: async (message) => {
    const response = await api.post('/api/ai/chat', { message });
    return response.data;
  },
};

export default aiService;
