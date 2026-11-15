import api from './api';

export const getWsUrl = () => {
  if (process.env.REACT_APP_WS_URL) return process.env.REACT_APP_WS_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:8001';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return 'ws://localhost:8001';
};

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
    return new WebSocket(`${getWsUrl()}/ws/telemetry`);
  },

  getWsUrl,
};

export default telemetryService;
