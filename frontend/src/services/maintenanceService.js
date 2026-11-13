import api from './api';

const MAINTENANCE_BASE = '/api/maintenance';

const maintenanceService = {
  getMaintenanceRecords: async (params = {}) => {
    const response = await api.get(MAINTENANCE_BASE, { params });
    return response.data;
  },

  getUpcoming: async (days = 14) => {
    const response = await api.get(`${MAINTENANCE_BASE}/upcoming`, { params: { days } });
    return response.data;
  },

  createMaintenance: async (data) => {
    const response = await api.post(MAINTENANCE_BASE, data);
    return response.data;
  },

  updateMaintenance: async (id, data) => {
    const response = await api.put(`${MAINTENANCE_BASE}/${id}`, data);
    return response.data;
  },
};

export default maintenanceService;
