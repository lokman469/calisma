// API endpoint'leri
export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token'
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile/update',
    CHANGE_PASSWORD: '/user/password/change'
  }
};

// Yerel depolama anahtarları
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language'
};

// Uygulama sabitleri
export const APP_CONSTANTS = {
  APP_NAME: 'React App',
  DEFAULT_LANGUAGE: 'tr',
  SUPPORTED_LANGUAGES: ['tr', 'en'],
  DEFAULT_THEME: 'light',
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 10,
    PER_PAGE_OPTIONS: [10, 25, 50, 100]
  },
  DATE_FORMAT: 'DD.MM.YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD.MM.YYYY HH:mm'
};

// HTTP durum kodları
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Hata mesajları
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ağ bağlantısı hatası',
  UNAUTHORIZED: 'Oturum süreniz doldu',
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'İstenilen kaynak bulunamadı',
  INTERNAL_SERVER_ERROR: 'Sunucu hatası',
  VALIDATION_ERROR: 'Form validasyon hatası'
}; 