import api from './api';

const ANALYTICS_BASE = '/api/analytics';

const analyticsService = {
  getOverview: async () => {
    const response = await api.get(`${ANALYTICS_BASE}/overview`);
    return response.data;
  },

  getMissionAnalytics: async (params = {}) => {
    const response = await api.get(`${ANALYTICS_BASE}/missions`, { params });
    return response.data;
  },

  getDroneAnalytics: async () => {
    const response = await api.get(`${ANALYTICS_BASE}/drones`);
    return response.data;
  },

  exportCSV: async (reportType = 'overview') => {
    const response = await api.get(`${ANALYTICS_BASE}/export/csv`, {
      params: { report_type: reportType },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drone_fleet_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportPDF: async (reportType = 'overview') => {
    const response = await api.get(`${ANALYTICS_BASE}/export/pdf`, {
      params: { report_type: reportType },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drone_fleet_${reportType}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default analyticsService;
