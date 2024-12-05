import { STORAGE_KEYS } from '../config/constants';

// Kullanıcı oturumunu başlat
export const login = (token, refreshToken, userData) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

// Kullanıcı oturumunu sonlandır
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

// Kullanıcı oturumunu kontrol et
export const isAuthenticated = () => {
  return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

// Kullanıcı verilerini al
export const getUserData = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
}; 