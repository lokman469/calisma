import { logger } from '../services/logger';

// Yakalanmamış hataları yakala
export function setupGlobalErrorHandlers() {
  // Promise hataları
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Yakalanmamış Promise hatası:', event.reason, {
      promise: event.promise
    });
  });

  // Global hatalar
  window.addEventListener('error', (event) => {
    logger.error('Global hata:', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Console hataları
  const originalConsoleError = console.error;
  console.error = (...args) => {
    logger.error('Console hatası:', args[0], {
      args: args.slice(1)
    });
    originalConsoleError.apply(console, args);
  };
}

// API hata işleyici
export function handleApiError(error, context = {}) {
  if (error.response) {
    // Sunucu yanıtı ile gelen hatalar
    logger.error('API Hatası:', error, {
      status: error.response.status,
      data: error.response.data,
      ...context
    });
  } else if (error.request) {
    // Yanıt alınamayan istekler
    logger.error('API İstek Hatası:', error, {
      request: error.request,
      ...context
    });
  } else {
    // İstek oluşturulurken oluşan hatalar
    logger.error('API Konfigürasyon Hatası:', error, context);
  }

  // Kullanıcıya gösterilecek hata mesajını döndür
  return {
    message: getErrorMessage(error),
    status: error.response?.status
  };
}

// Hata mesajlarını özelleştir
function getErrorMessage(error) {
  if (error.response?.status === 404) {
    return 'İstenen kaynak bulunamadı';
  }
  if (error.response?.status === 401) {
    return 'Oturum süreniz doldu, lütfen tekrar giriş yapın';
  }
  if (error.response?.status === 403) {
    return 'Bu işlem için yetkiniz bulunmuyor';
  }
  if (error.response?.status >= 500) {
    return 'Sunucu hatası, lütfen daha sonra tekrar deneyin';
  }
  return error.message || 'Bir hata oluştu';
} 