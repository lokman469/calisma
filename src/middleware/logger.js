import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Log seviyeleri
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug'
};

// Log kategorileri
const LOG_CATEGORIES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  DATABASE: 'database',
  AUTH: 'auth',
  SYSTEM: 'system',
  CUSTOM: 'custom'
};

// Winston logger yapılandırması
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.errors({ stack: true })
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transport - errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport - all logs
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Request logging middleware
export const requestLogger = (options = {}) => {
  const {
    logBody = true,
    logQuery = true,
    logHeaders = false,
    excludePaths = ['/health', '/metrics'],
    excludeMethods = ['OPTIONS'],
    sensitiveFields = ['password', 'token', 'apiKey', 'secret'],
    logLevel = LOG_LEVELS.INFO
  } = options;

  return (req, res, next) => {
    // Excluded paths kontrolü
    if (excludePaths.includes(req.path)) {
      return next();
    }

    // Excluded methods kontrolü
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    // Request ID oluştur
    req.id = req.id || uuidv4();

    // Request başlangıç zamanı
    req._startTime = Date.now();

    // Request log objesi
    const logData = {
      requestId: req.id,
      category: LOG_CATEGORIES.REQUEST,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Query parameters
    if (logQuery && Object.keys(req.query).length > 0) {
      logData.query = sanitizeData(req.query, sensitiveFields);
    }

    // Request body
    if (logBody && Object.keys(req.body).length > 0) {
      logData.body = sanitizeData(req.body, sensitiveFields);
    }

    // Headers
    if (logHeaders) {
      logData.headers = sanitizeData(req.headers, sensitiveFields);
    }

    // User bilgisi
    if (req.user) {
      logData.userId = req.user.id;
      logData.userRole = req.user.role;
    }

    // Response logging
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      res.body = body;

      // Response süresini hesapla
      const responseTime = Date.now() - req._startTime;

      // Response log objesi
      const responseData = {
        ...logData,
        category: LOG_CATEGORIES.RESPONSE,
        statusCode: res.statusCode,
        responseTime,
        contentLength: Buffer.byteLength(body, 'utf8')
      };

      // Error durumunda detay ekle
      if (res.statusCode >= 400) {
        responseData.error = sanitizeData(
          typeof body === 'string' ? { message: body } : body,
          sensitiveFields
        );
        logger.error(responseData);
      } else {
        logger.log(logLevel, responseData);
      }

      return originalSend.call(this, body);
    };

    // Initial request log
    logger.log(logLevel, logData);
    next();
  };
};

// Database logging middleware
export const databaseLogger = (options = {}) => {
  const {
    logQueries = true,
    logResults = false,
    excludeCollections = ['logs', 'sessions'],
    sensitiveFields = ['password', 'token', 'apiKey'],
    logLevel = LOG_LEVELS.DEBUG
  } = options;

  return async (req, res, next) => {
    if (!req.dbOperation) {
      return next();
    }

    const { operation, collection, query, changes } = req.dbOperation;

    // Excluded collections kontrolü
    if (excludeCollections.includes(collection)) {
      return next();
    }

    // Log objesi
    const logData = {
      requestId: req.id,
      category: LOG_CATEGORIES.DATABASE,
      timestamp: new Date().toISOString(),
      operation,
      collection,
      userId: req.user?.id
    };

    // Query detayları
    if (logQueries && query) {
      logData.query = sanitizeData(query, sensitiveFields);
    }

    // Değişiklik detayları
    if (changes) {
      logData.changes = sanitizeData(changes, sensitiveFields);
    }

    // Sonuçlar
    if (logResults && req.dbResult) {
      logData.result = sanitizeData(req.dbResult, sensitiveFields);
    }

    logger.log(logLevel, logData);
    next();
  };
};

// Yardımcı fonksiyonlar
const sanitizeData = (data, sensitiveFields) => {
  if (!data) return data;

  const sanitized = { ...data };
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '***';
    }
  });

  return sanitized;
};

export { logger, LOG_LEVELS, LOG_CATEGORIES }; 