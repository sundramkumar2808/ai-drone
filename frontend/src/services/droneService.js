import api from './api';

const DRONES_BASE = '/api/drones';

const droneService = {
  /**
   * Get all drones with optional query params (status, search, page, limit)
   */
  getDrones: async (params = {}) => {
    const response = await api.get(DRONES_BASE, { params });
    return response.data;
  },

  /**
   * Get a single drone by ID
   */
  getDrone: async (id) => {
    const response = await api.get(`${DRONES_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new drone
   */
  createDrone: async (data) => {
    const response = await api.post(DRONES_BASE, data);
    return response.data;
  },

  /**
   * Update a drone
   */
  updateDrone: async (id, data) => {
    const response = await api.put(`${DRONES_BASE}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a drone
   */
  deleteDrone: async (id) => {
    const response = await api.delete(`${DRONES_BASE}/${id}`);
    return response.data;
  },
};

export default droneService;
