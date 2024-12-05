import { API_CONFIG } from '../services/apiConfig';

class RateLimiter {
  constructor(limit, interval = 60000) {
    this.limit = limit;
    this.interval = interval;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.interval);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0];
      const waitTime = this.interval - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

export const rateLimiters = {
  binance: new RateLimiter(API_CONFIG.BINANCE.REST_RATE_LIMIT),
  kucoin: new RateLimiter(API_CONFIG.KUCOIN.REST_RATE_LIMIT),
  bybit: new RateLimiter(API_CONFIG.BYBIT.REST_RATE_LIMIT),
  mexc: new RateLimiter(API_CONFIG.MEXC.REST_RATE_LIMIT)
}; 