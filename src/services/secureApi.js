import axios from 'axios';
import { securityService } from './security';

const secureApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': securityService.generateCsrfToken()
  }
});

// İstek interceptor'ı
secureApi.interceptors.request.use(
  (config) => {
    // Session kontrolü
    if (!securityService.validateSession()) {
      window.location.href = '/login';
      return Promise.reject('Oturum süresi doldu');
    }

    // Token ekleme
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Input sanitization
    if (config.data) {
      config.data = sanitizeRequestData(config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt interceptor'ı
secureApi.interceptors.response.use(
  (response) => {
    // Yanıt verilerini sanitize et
    if (response.data) {
      response.data = sanitizeResponseData(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      securityService.clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Veri sanitizasyonu
function sanitizeRequestData(data) {
  if (typeof data === 'object') {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = securityService.sanitizeInput(data[key]);
      return acc;
    }, {});
  }
  return securityService.sanitizeInput(data);
}

function sanitizeResponseData(data) {
  // Güvenilir kaynaktan gelen veriyi sanitize etme
  return data;
}

export default secureApi; 