import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { createRateLimitError } from './error';

// Limit tipleri
const LIMIT_TYPES = {
  IP: 'ip',
  USER: 'user',
  API_KEY: 'api_key',
  COMBINED: 'combined'
};

// Zaman pencereleri (milisaniye)
const TIME_WINDOWS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

// Varsayılan limit ayarları
const DEFAULT_OPTIONS = {
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her pencerede maksimum istek
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  statusCode: 429,
  headers: true,
  draft_polli_ratelimit_headers: true,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  requestPropertyName: 'rateLimit',
  skipTokens: []
};

// Rate limit middleware factory
export const createRateLimiter = (options = {}) => {
  const {
    type = LIMIT_TYPES.IP,
    points = 100,
    duration = 15 * 60, // 15 dakika
    blockDuration = 60 * 60, // 1 saat
    keyPrefix = 'rl',
    errorHandler,
    skip,
    store = 'memory',
    storeClient = redis,
    ...rest
  } = options;

  // Store seçimi
  const limiterStore = store === 'redis'
    ? new RedisStore({
        client: storeClient,
        prefix: keyPrefix,
        resetExpiryOnChange: true
      })
    : undefined; // Memory store için undefined bırak

  // Key generator
  const keyGenerator = (req) => {
    switch (type) {
      case LIMIT_TYPES.USER:
        return req.user ? `${keyPrefix}:user:${req.user.id}` : req.ip;
      
      case LIMIT_TYPES.API_KEY:
        return req.apiKey ? `${keyPrefix}:api:${req.apiKey}` : req.ip;
      
      case LIMIT_TYPES.COMBINED:
        const parts = [];
        if (req.user) parts.push(`user:${req.user.id}`);
        if (req.apiKey) parts.push(`api:${req.apiKey}`);
        parts.push(`ip:${req.ip}`);
        return `${keyPrefix}:${parts.join(':')}`;
      
      case LIMIT_TYPES.IP:
      default:
        return `${keyPrefix}:ip:${req.ip}`;
    }
  };

  // Skip fonksiyonu
  const skipFunction = (req) => {
    // Custom skip function
    if (skip && typeof skip === 'function') {
      return skip(req);
    }

    // Skip tokens
    if (options.skipTokens?.includes(req.headers['x-skip-limit'])) {
      return true;
    }

    // Admin users
    if (req.user?.role === 'admin') {
      return true;
    }

    return false;
  };

  // Error handler
  const handleError = (req, res, next, options) => {
    if (errorHandler && typeof errorHandler === 'function') {
      return errorHandler(req, res, next, options);
    }

    const error = createRateLimitError(options.message || DEFAULT_OPTIONS.message);
    error.resetTime = new Date(Date.now() + options.windowMs);
    error.limit = options.max;
    error.remaining = 0;

    next(error);
  };

  // Rate limiter options
  const limiterOptions = {
    ...DEFAULT_OPTIONS,
    ...rest,
    windowMs: duration * 1000,
    max: points,
    store: limiterStore,
    keyGenerator,
    skip: skipFunction,
    handler: handleError,
    standardHeaders: true,
    legacyHeaders: false
  };

  // Rate limiter middleware
  return rateLimit(limiterOptions);
};

// Özel limit middleware'leri
export const apiLimiter = createRateLimiter({
  type: LIMIT_TYPES.API_KEY,
  points: 1000,
  duration: 60 * 60, // 1 saat
  keyPrefix: 'rl:api',
  store: 'redis'
});

export const userLimiter = createRateLimiter({
  type: LIMIT_TYPES.USER,
  points: 500,
  duration: 15 * 60, // 15 dakika
  keyPrefix: 'rl:user',
  store: 'redis'
});

export const ipLimiter = createRateLimiter({
  type: LIMIT_TYPES.IP,
  points: 100,
  duration: 15 * 60, // 15 dakika
  keyPrefix: 'rl:ip',
  store: 'redis'
});

// Dynamic rate limiter
export const dynamicLimiter = (getOptions) => {
  return async (req, res, next) => {
    try {
      const options = typeof getOptions === 'function'
        ? await getOptions(req)
        : getOptions;

      const limiter = createRateLimiter(options);
      return limiter(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export { LIMIT_TYPES, TIME_WINDOWS }; 