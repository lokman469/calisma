import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS, HTTP_STATUS } from './constants';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token'ı header'a ekle
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Token yenileme işlemi
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
          refresh_token: refreshToken
        });

        const { token } = response.data;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (error) {
        // Token yenileme başarısız - kullanıcıyı çıkış yap
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api; 