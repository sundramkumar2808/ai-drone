import api from './api';

const AUTH_BASE = '/api/auth';

const authService = {
  /**
   * Login with email and password
   */
  login: async (email, password) => {
    const response = await api.post(`${AUTH_BASE}/login`, { email, password });
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await api.post(`${AUTH_BASE}/register`, userData);
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async () => {
    try {
      await api.post(`${AUTH_BASE}/logout`);
    } catch (error) {
      // Ignore errors on logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get(`${AUTH_BASE}/me`);
    return response.data;
  },

  /**
   * Send forgot password email
   */
  forgotPassword: async (email) => {
    const response = await api.post(`${AUTH_BASE}/forgot-password`, { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, password) => {
    const response = await api.post(`${AUTH_BASE}/reset-password`, { token, password });
    return response.data;
  },

  /**
   * Redirect to Google OAuth login
   */
  googleLogin: () => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    window.location.href = `${baseURL}${AUTH_BASE}/google`;
  },

  /**
   * Redirect to GitHub OAuth login
   */
  githubLogin: () => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    window.location.href = `${baseURL}${AUTH_BASE}/github`;
  },
};

export default authService;
