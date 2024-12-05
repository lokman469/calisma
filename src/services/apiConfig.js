export const API_CONFIG = {
  BINANCE: {
    REST_BASE: 'https://api.binance.com/api/v3',
    REST_RATE_LIMIT: 1200,
    WS_BASE: 'wss://stream.binance.com:9443/ws',
    API_KEY: process.env.REACT_APP_BINANCE_API_KEY,
    API_SECRET: process.env.REACT_APP_BINANCE_SECRET
  },
  KUCOIN: {
    REST_BASE: 'https://api.kucoin.com/api/v1',
    REST_RATE_LIMIT: 100,
    WS_BASE: 'wss://push1.kucoin.com/endpoint',
    API_KEY: process.env.REACT_APP_KUCOIN_API_KEY,
    API_SECRET: process.env.REACT_APP_KUCOIN_SECRET
  },
  BYBIT: {
    REST_BASE: 'https://api.bybit.com/v5',
    REST_RATE_LIMIT: 50,
    WS_BASE: 'wss://stream.bybit.com/v5/public/spot',
    API_KEY: process.env.REACT_APP_BYBIT_API_KEY,
    API_SECRET: process.env.REACT_APP_BYBIT_SECRET
  },
  MEXC: {
    REST_BASE: 'https://api.mexc.com/api/v3',
    REST_RATE_LIMIT: 60,
    WS_BASE: 'wss://wbs.mexc.com/ws',
    API_KEY: process.env.REACT_APP_MEXC_API_KEY,
    API_SECRET: process.env.REACT_APP_MEXC_SECRET
  }
}; 