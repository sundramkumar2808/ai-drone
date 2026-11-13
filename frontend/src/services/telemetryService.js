import api from './api';

const telemetryService = {
  getTelemetry: async () => {
    const response = await api.get('/api/telemetry');
    return response.data;
  },

  getDroneTelemetry: async (droneId, limit = 50) => {
    const response = await api.get(`/api/telemetry/${droneId}`, { params: { limit } });
    return response.data;
  },

  createWebSocket: () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8001';
    return new WebSocket(`${wsUrl}/ws/telemetry`);
  },
};

export default telemetryService;
