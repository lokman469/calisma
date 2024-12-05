import { logger } from '../utils/logger';

// Hata tipleri
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  NOT_FOUND: 'NotFoundError',
  RATE_LIMIT: 'RateLimitError',
  DATABASE: 'DatabaseError',
  NETWORK: 'NetworkError',
  INTERNAL: 'InternalError'
};

// HTTP durum kodları
const STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500
};

// Özel hata sınıfları
class AppError extends Error {
  constructor(type, message, statusCode) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.timestamp = new Date();
  }
}

// Hata yakalama middleware'i
export const errorHandler = (options = {}) => {
  const {
    logErrors = true,
    stackTrace = process.env.NODE_ENV === 'development',
    defaultMessage = 'Bir hata oluştu',
    defaultType = ERROR_TYPES.INTERNAL,
    defaultStatus = STATUS_CODES.INTERNAL_ERROR
  } = options;

  return async (error, req, res, next) => {
    try {
      // Hata detaylarını hazırla
      const errorResponse = {
        success: false,
        error: {
          type: error.type || defaultType,
          message: error.message || defaultMessage,
          code: error.statusCode || defaultStatus,
          timestamp: error.timestamp || new Date(),
          path: req.path,
          method: req.method
        }
      };

      // Development ortamında stack trace ekle
      if (stackTrace) {
        errorResponse.error.stack = error.stack;
      }

      // Request ID ekle
      if (req.id) {
        errorResponse.error.requestId = req.id;
      }

      // Hata tipine göre status code belirle
      let statusCode = error.statusCode || defaultStatus;
      switch (error.type) {
        case ERROR_TYPES.VALIDATION:
          statusCode = STATUS_CODES.BAD_REQUEST;
          break;
        case ERROR_TYPES.AUTHENTICATION:
          statusCode = STATUS_CODES.UNAUTHORIZED;
          break;
        case ERROR_TYPES.AUTHORIZATION:
          statusCode = STATUS_CODES.FORBIDDEN;
          break;
        case ERROR_TYPES.NOT_FOUND:
          statusCode = STATUS_CODES.NOT_FOUND;
          break;
        case ERROR_TYPES.RATE_LIMIT:
          statusCode = STATUS_CODES.RATE_LIMIT;
          break;
      }

      // Hatayı logla
      if (logErrors) {
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        logger[logLevel]({
          type: error.type,
          message: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          requestId: req.id,
          userId: req.user?.id,
          timestamp: error.timestamp
        });
      }

      // Hata yanıtını gönder
      res.status(statusCode).json(errorResponse);

    } catch (err) {
      // Fallback error handler
      console.error('Error handler failed:', err);
      res.status(500).json({
        success: false,
        error: {
          type: ERROR_TYPES.INTERNAL,
          message: defaultMessage,
          code: STATUS_CODES.INTERNAL_ERROR,
          timestamp: new Date()
        }
      });
    }
  };
};

// Validation hatası oluşturucu
export const createValidationError = (message, details = {}) => {
  return new AppError(
    ERROR_TYPES.VALIDATION,
    message,
    STATUS_CODES.BAD_REQUEST,
    details
  );
};

// Auth hatası oluşturucu
export const createAuthError = (message) => {
  return new AppError(
    ERROR_TYPES.AUTHENTICATION,
    message,
    STATUS_CODES.UNAUTHORIZED
  );
};

// Yetki hatası oluşturucu
export const createPermissionError = (message) => {
  return new AppError(
    ERROR_TYPES.AUTHORIZATION,
    message,
    STATUS_CODES.FORBIDDEN
  );
};

// Not found hatası oluşturucu
export const createNotFoundError = (message) => {
  return new AppError(
    ERROR_TYPES.NOT_FOUND,
    message,
    STATUS_CODES.NOT_FOUND
  );
};

// Rate limit hatası oluşturucu
export const createRateLimitError = (message) => {
  return new AppError(
    ERROR_TYPES.RATE_LIMIT,
    message,
    STATUS_CODES.RATE_LIMIT
  );
};

export { ERROR_TYPES, STATUS_CODES, AppError }; 