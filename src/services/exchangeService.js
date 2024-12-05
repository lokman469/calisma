import axios from 'axios';
import { rateLimiters } from '../utils/apiUtils';
import { API_CONFIG } from './apiConfig';
import { wsManager } from './websocketService';
import { createHash, createHmac } from 'crypto-browserify';

// Yardımcı fonksiyonlar
const createSignature = (queryString, apiSecret) => {
  return createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
};

// Axios instance'ları oluştur
const createAxiosInstance = (exchange) => {
  const instance = axios.create({
    baseURL: API_CONFIG[exchange].REST_BASE,
    timeout: 10000,
    headers: {
      'X-MBX-APIKEY': API_CONFIG[exchange].API_KEY
    }
  });

  // İstek interceptor'ı
  instance.interceptors.request.use(async (config) => {
    await rateLimiters[exchange.toLowerCase()].throttle();
    return config;
  });

  // Yanıt interceptor'ı
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        switch (error.response.status) {
          case 429:
            console.error(`${exchange} rate limit aşıldı`);
            break;
          case 418:
            console.error(`${exchange} IP banlandı`);
            break;
          case 403:
            console.error(`${exchange} API key hatası`);
            break;
          default:
            console.error(`${exchange} API hatası:`, error.response.data);
        }
      }
      throw error;
    }
  );

  return instance;
};

const instances = {
  binance: createAxiosInstance('BINANCE'),
  kucoin: createAxiosInstance('KUCOIN'),
  bybit: createAxiosInstance('BYBIT'),
  mexc: createAxiosInstance('MEXC')
};

// Market verilerini normalize et
const normalizeMarketData = (data, exchange) => {
  switch (exchange) {
    case 'Binance':
      return {
        symbol: data.symbol,
        baseAsset: data.baseAsset,
        quoteAsset: data.quoteAsset,
        price: data.price,
        volume: data.volume,
        exchange: 'Binance'
      };
    case 'KuCoin':
      return {
        symbol: data.symbol,
        baseAsset: data.baseCurrency,
        quoteAsset: data.quoteCurrency,
        price: data.price,
        volume: data.volume,
        exchange: 'KuCoin'
      };
    // Diğer borsalar için benzer dönüşümler
    default:
      throw new Error('Desteklenmeyen borsa');
  }
};

export const exchangeService = {
  // Tüm borsalardan spot marketleri getir
  async getAllSpotMarkets() {
    try {
      const [binanceMarkets, kucoinMarkets, bybitMarkets, mexcMarkets] = await Promise.all([
        this.getBinanceSpotMarkets(),
        this.getKucoinSpotMarkets(),
        this.getBybitSpotMarkets(),
        this.getMexcSpotMarkets()
      ]);

      return {
        binance: binanceMarkets,
        kucoin: kucoinMarkets,
        bybit: bybitMarkets,
        mexc: mexcMarkets
      };
    } catch (error) {
      console.error('Marketler getirilemedi:', error);
      throw error;
    }
  },

  // Binance
  async getBinanceSpotMarkets() {
    const response = await axios.get(`${BINANCE_API}/exchangeInfo`);
    return response.data.symbols
      .filter(symbol => symbol.status === 'TRADING')
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        exchange: 'Binance'
      }));
  },

  async getBinanceFuturesMarkets() {
    const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
    return response.data.symbols
      .filter(symbol => symbol.status === 'TRADING')
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        exchange: 'Binance Futures'
      }));
  },

  // KuCoin
  async getKucoinSpotMarkets() {
    const response = await axios.get(`${KUCOIN_API}/symbols`);
    return response.data.data
      .filter(symbol => symbol.enableTrading)
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseCurrency,
        quoteAsset: symbol.quoteCurrency,
        exchange: 'KuCoin'
      }));
  },

  // Bybit
  async getBybitSpotMarkets() {
    const response = await axios.get(`${BYBIT_API}/market/tickers`, {
      params: { category: 'spot' }
    });
    return response.data.result.list.map(symbol => ({
      symbol: symbol.symbol,
      baseAsset: symbol.symbol.split('-')[0],
      quoteAsset: symbol.symbol.split('-')[1],
      exchange: 'Bybit'
    }));
  },

  // MEXC
  async getMexcSpotMarkets() {
    const response = await axios.get(`${MEXC_API}/exchangeInfo`);
    return response.data.symbols
      .filter(symbol => symbol.status === 'ENABLED')
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        exchange: 'MEXC'
      }));
  },

  // Market Derinliği
  async getMarketDepth(exchange, symbol) {
    try {
      await rateLimiters[exchange.toLowerCase()].throttle();
      const response = await instances[exchange.toLowerCase()].get('/depth', {
        params: { symbol, limit: 100 }
      });
      return normalizeMarketData(response.data, exchange);
    } catch (error) {
      console.error(`${exchange} market derinliği hatası:`, error);
      throw error;
    }
  },

  async subscribeToMarketData(exchange, symbol, callback) {
    try {
      const ws = await wsManager.connect(exchange, symbol, 'trade');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const normalizedData = normalizeMarketData(data, exchange);
        callback(normalizedData);
      };

      return () => wsManager.disconnect(exchange, symbol, 'trade');
    } catch (error) {
      console.error(`${exchange} WebSocket bağlantı hatası:`, error);
      throw error;
    }
  }
}; 