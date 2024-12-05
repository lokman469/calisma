import { STORAGE_KEYS } from '../config/constants';

const storageService = {
  // Token işlemleri
  getToken: () => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),

  // Refresh token işlemleri
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),

  // Kullanıcı verisi işlemleri
  getUserData: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },
  setUserData: (data) => localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data)),
  removeUserData: () => localStorage.removeItem(STORAGE_KEYS.USER_DATA),

  // Tema modu işlemleri
  getThemeMode: () => localStorage.getItem(STORAGE_KEYS.THEME_MODE) || 'light',
  setThemeMode: (mode) => localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode),

  // Dil işlemleri
  getLanguage: () => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'tr',
  setLanguage: (lang) => localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang),

  // Tüm storage'ı temizle
  clearAll: () => localStorage.clear()
};

export default storageService; 