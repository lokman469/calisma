import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import { login as authLogin, logout as authLogout } from '../utils/auth';

const authService = {
  // Giriş yap
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const { token, refreshToken, user } = response.data;
    authLogin(token, refreshToken, user);
    return response.data;
  },

  // Kayıt ol
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    const { token, refreshToken, user } = response.data;
    authLogin(token, refreshToken, user);
    return response.data;
  },

  // Çıkış yap
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      authLogout();
    }
  },

  // Token yenile
  refreshToken: async (refreshToken) => {
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refresh_token: refreshToken
    });
    return response.data;
  }
};

export default authService; 