import api from './api';

const ALERTS_BASE = '/api/alerts';

const alertService = {
  getAlerts: async (params = {}) => {
    const response = await api.get(ALERTS_BASE, { params });
    return response.data;
  },

  markAlertRead: async (id) => {
    const response = await api.put(`${ALERTS_BASE}/${id}/read`);
    return response.data;
  },

  getNotifications: async (params = {}) => {
    const response = await api.get(`${ALERTS_BASE}/notifications`, { params });
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`${ALERTS_BASE}/notifications/${id}/read`);
    return response.data;
  },
};

export default alertService;
