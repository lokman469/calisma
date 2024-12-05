import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

// Kullanıcı servisleri
export const userService = {
  // Profil bilgilerini getir
  getProfile: () => {
    return api.get(API_ENDPOINTS.USER.PROFILE);
  },

  // Profil bilgilerini güncelle
  updateProfile: (data) => {
    return api.put(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
  },

  // Şifre değiştir
  changePassword: (data) => {
    return api.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, data);
  }
};

// Veri servisleri
export const dataService = {
  // Liste getir
  getList: (endpoint, params) => {
    return api.get(endpoint, { params });
  },

  // Tekil kayıt getir
  getById: (endpoint, id) => {
    return api.get(`${endpoint}/${id}`);
  },

  // Yeni kayıt oluştur
  create: (endpoint, data) => {
    return api.post(endpoint, data);
  },

  // Kayıt güncelle
  update: (endpoint, id, data) => {
    return api.put(`${endpoint}/${id}`, data);
  },

  // Kayıt sil
  delete: (endpoint, id) => {
    return api.delete(`${endpoint}/${id}`);
  }
}; 