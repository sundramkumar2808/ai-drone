import api from './api';

const ADMIN_BASE = '/api/admin';

const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get(`${ADMIN_BASE}/users`, { params });
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post(`${ADMIN_BASE}/users`, data);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`${ADMIN_BASE}/users/${userId}`, { role });
    return response.data;
  },

  disableUser: async (userId) => {
    const response = await api.put(`${ADMIN_BASE}/users/${userId}/disable`);
    return response.data;
  },

  deleteUser: async (userId) => {
    await api.delete(`${ADMIN_BASE}/users/${userId}`);
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get(`${ADMIN_BASE}/activity-logs`, { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(`${ADMIN_BASE}/stats`);
    return response.data;
  },
};

export default adminService;
