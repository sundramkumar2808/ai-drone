import api from './api';

const MISSIONS_BASE = '/api/missions';

const missionService = {
  getMissions: async (params = {}) => {
    const response = await api.get(MISSIONS_BASE, { params });
    return response.data;
  },

  getMission: async (id) => {
    const response = await api.get(`${MISSIONS_BASE}/${id}`);
    return response.data;
  },

  createMission: async (data) => {
    const response = await api.post(MISSIONS_BASE, data);
    return response.data;
  },

  updateMission: async (id, data) => {
    const response = await api.put(`${MISSIONS_BASE}/${id}`, data);
    return response.data;
  },

  deleteMission: async (id) => {
    const response = await api.delete(`${MISSIONS_BASE}/${id}`);
    return response.data;
  },
};

export default missionService;
