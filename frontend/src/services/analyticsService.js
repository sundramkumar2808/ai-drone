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
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drone_fleet_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },

  exportPDF: async (reportType = 'overview') => {
    const response = await api.get(`${ANALYTICS_BASE}/export/pdf`, {
      params: { report_type: reportType },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drone_fleet_${reportType}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
};

export default analyticsService;
