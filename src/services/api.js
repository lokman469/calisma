import axios from 'axios';

// API istemcisini oluştur
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://api.coingecko.com/api/v3',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// İstek interceptor'ı
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Coin API'leri
export const coinApi = {
  getList: (params) => api.get('/coins/list', { params }),
  getMarkets: (params) => api.get('/coins/markets', { params }),
  getCoin: (id) => api.get(`/coins/${id}`),
  getChart: (id, params) => api.get(`/coins/${id}/market_chart`, { params }),
  getTickers: (id) => api.get(`/coins/${id}/tickers`),
  getGlobal: () => api.get('/global')
};

// Market API'leri
export const marketApi = {
  getExchanges: () => api.get('/exchanges'),
  getExchangeRates: () => api.get('/exchange_rates'),
  getOrderBook: (exchange, coinId) => 
    api.get(`/exchanges/${exchange}/orderbook/${coinId}`),
  getTrades: (exchange, coinId) => 
    api.get(`/exchanges/${exchange}/trades/${coinId}`)
};

// Portfolyo API'leri
export const portfolioApi = {
  get: () => api.get('/portfolio'),
  add: (data) => api.post('/portfolio', data),
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  delete: (id) => api.delete(`/portfolio/${id}`)
};

// Alarm API'leri
export const alertApi = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`)
};

// Kullanıcı API'leri
export const userApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  updateSettings: (data) => api.put('/user/settings', data),
  resetPassword: (email) => api.post('/auth/reset-password', { email })
};

// WebSocket bağlantısı
export class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.subscribers = new Map();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket bağlantısı kuruldu');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (this.subscribers.has(data.type)) {
        this.subscribers.get(data.type).forEach(callback => callback(data));
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket bağlantısı kapandı');
      setTimeout(() => this.connect(), 5000);
    };
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    return () => this.subscribers.get(type).delete(callback);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// WebSocket servisini oluştur
export const wsService = new WebSocketService(
  process.env.REACT_APP_WS_URL || 'wss://stream.binance.com:9443/ws'
); 