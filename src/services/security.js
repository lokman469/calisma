import CryptoJS from 'crypto-js';
import axios from 'axios';

class SecurityService {
  constructor() {
    if (!process.env.REACT_APP_ENCRYPTION_KEY) {
      throw new Error('Encryption key is required');
    }
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY;
  }

  // Veri şifreleme
  encrypt(data) {
    if (!data) return null;
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, this.encryptionKey).toString();
  }

  // Veri şifre çözme
  decrypt(encryptedData) {
    if (!encryptedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('Şifre çözme hatası:', error);
      return null;
    }
  }

  // XSS koruması
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // CSRF token yönetimi
  generateCsrfToken() {
    const token = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem('csrfToken', token);
    return token;
  }

  validateCsrfToken(token) {
    return token === localStorage.getItem('csrfToken');
  }

  // Güvenli localStorage
  secureSet(key, value) {
    const encryptedValue = this.encrypt(value);
    localStorage.setItem(key, encryptedValue);
  }

  secureGet(key) {
    const encryptedValue = localStorage.getItem(key);
    return this.decrypt(encryptedValue);
  }

  // Parola gücü kontrolü
  checkPasswordStrength(password) {
    const result = {
      score: 0,
      feedback: []
    };

    if (password.length < 8) {
      result.feedback.push('Parola en az 8 karakter olmalıdır');
    }
    if (!/[A-Z]/.test(password)) {
      result.feedback.push('En az bir büyük harf içermelidir');
    }
    if (!/[a-z]/.test(password)) {
      result.feedback.push('En az bir küçük harf içermelidir');
    }
    if (!/[0-9]/.test(password)) {
      result.feedback.push('En az bir rakam içermelidir');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      result.feedback.push('En az bir özel karakter içermelidir');
    }

    result.score = 5 - result.feedback.length;
    return result;
  }

  // Oturum güvenliği
  validateSession() {
    const session = this.secureGet('session');
    if (!session) return false;

    const now = new Date().getTime();
    if (now > session.expiresAt) {
      this.clearSession();
      return false;
    }
    return true;
  }

  clearSession() {
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    localStorage.removeItem('csrfToken');
  }
}

export const securityService = new SecurityService();

// API istekleri için interceptor ekleyin
const getSecurityToken = () => {
  return securityService.secureGet('token');
};

axios.interceptors.request.use(config => {
  config.headers['X-Security-Token'] = getSecurityToken();
  return config;
}); 