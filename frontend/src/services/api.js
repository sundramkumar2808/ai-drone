import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // Only redirect if not already on auth pages
        const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
        const currentPath = window.location.pathname;
        if (!authPaths.some((path) => currentPath.startsWith(path))) {
          window.location.href = '/login';
        }
      }

      // Extract error message from backend response
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        error.response.data?.error ||
        'An unexpected error occurred';

      error.message = message;
    } else if (error.request) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
