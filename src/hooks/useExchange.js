import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSocket } from './useSocket';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'exchanges';
const CACHE_KEY = 'exchange_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

const EXCHANGE_TYPES = {
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures',
  OPTIONS: 'options'
};

const EXCHANGE_STATUS = {
  ONLINE: 'online',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
  RESTRICTED: 'restricted'
};

const API_METHODS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  TRADING: 'trading'
};

const RATE_LIMITS = {
  PUBLIC: { requests: 100, interval: 60000 }, // 100 istek/dakika
  PRIVATE: { requests: 50, interval: 60000 }, // 50 istek/dakika
  TRADING: { requests: 20, interval: 60000 }  // 20 istek/dakika
};

export const useExchange = (exchangeId = null, options = {}) => {
  const [exchange, setExchange] = useState(null);
  const [markets, setMarkets] = useState({});
  const [orderbook, setOrderbook] = useState({});
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(EXCHANGE_STATUS.OFFLINE);
  
  const rateLimitsRef = useRef({});
  const lastFetchRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const requestQueueRef = useRef([]);
  const exchangeHistoryRef = useRef(new Map());

  const { socket, subscribe, unsubscribe } = useSocket();
  const { settings } = useSettings();

  const {
    enableCache = true,
    autoUpdate = true,
    updateInterval = 5000, // 5 saniye
    enableRateLimiting = true,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000,
    validateResponses = true,
    logRequests = true
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${exchangeId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Cache okuma hatası:', err);
    }
    return null;
  }, [enableCache, exchangeId]);

  const saveToCache = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${exchangeId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, exchangeId]);

  // Rate limit kontrolü
  const checkRateLimit = useCallback((method) => {
    if (!enableRateLimiting) return true;

    const now = Date.now();
    const limit = RATE_LIMITS[method];
    
    if (!rateLimitsRef.current[method]) {
      rateLimitsRef.current[method] = {
        requests: [],
        timeout: null
      };
    }

    const { requests } = rateLimitsRef.current[method];
    
    // Eski istekleri temizle
    const validRequests = requests.filter(
      timestamp => now - timestamp < limit.interval
    );
    
    if (validRequests.length >= limit.requests) {
      return false;
    }

    validRequests.push(now);
    rateLimitsRef.current[method].requests = validRequests;
    return true;
  }, [enableRateLimiting]);

  // API isteği yap
  const makeRequest = useCallback(async (endpoint, method = API_METHODS.PUBLIC, params = {}) => {
    if (!checkRateLimit(method)) {
      throw new Error('Rate limit aşıldı');
    }

    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exchange: exchangeId,
        method,
        params
      })
    };

    let retries = 0;
    while (retries <= maxRetries) {
      try {
        const response = await fetch(`/api/exchange/${endpoint}`, config);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (validateResponses && !validateResponse(data)) {
          throw new Error('Geçersiz API yanıtı');
        }

        if (logRequests) {
          console.log(`Exchange API request: ${endpoint}`, {
            method,
            params,
            response: data
          });
        }

        return data;

      } catch (err) {
        retries++;
        
        if (retries > maxRetries || !retryOnError) {
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      }
    }
  }, [exchangeId, checkRateLimit, maxRetries, retryDelay, retryOnError, validateResponses, logRequests]);

  // Market verilerini getir
  const fetchMarkets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await makeRequest('markets', API_METHODS.PUBLIC);
      setMarkets(data.markets);
      
      if (data.status) {
        setStatus(data.status);
      }

      return data.markets;

    } catch (err) {
      console.error('Market verisi getirme hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [makeRequest]);

  // Orderbook verilerini getir
  const fetchOrderbook = useCallback(async (symbol, limit = 100) => {
    try {
      const data = await makeRequest('orderbook', API_METHODS.PUBLIC, {
        symbol,
        limit
      });

      setOrderbook(prev => ({
        ...prev,
        [symbol]: data.orderbook
      }));

      return data.orderbook;

    } catch (err) {
      console.error('Orderbook verisi getirme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [makeRequest]);

  // Trade verilerini getir
  const fetchTrades = useCallback(async (symbol, limit = 100) => {
    try {
      const data = await makeRequest('trades', API_METHODS.PUBLIC, {
        symbol,
        limit
      });

      setTrades(prev => ({
        ...prev,
        [symbol]: data.trades
      }));

      return data.trades;

    } catch (err) {
      console.error('Trade verisi getirme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [makeRequest]);

  // Order oluştur
  const createOrder = useCallback(async (orderData) => {
    try {
      const data = await makeRequest('order', API_METHODS.TRADING, orderData);
      return data.order;

    } catch (err) {
      console.error('Order oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [makeRequest]);

  // Order iptal et
  const cancelOrder = useCallback(async (orderId) => {
    try {
      const data = await makeRequest('cancel', API_METHODS.TRADING, {
        orderId
      });
      return data.success;

    } catch (err) {
      console.error('Order iptal hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [makeRequest]);

  // WebSocket abonelikleri
  useEffect(() => {
    if (!socket || !exchange) return;

    // Market verilerine abone ol
    Object.keys(markets).forEach(symbol => {
      subscribe(`orderbook:${symbol}`);
      subscribe(`trades:${symbol}`);
    });

    // Event listener'ları ekle
    socket.on('orderbook_update', handleOrderbookUpdate);
    socket.on('trade_update', handleTradeUpdate);
    socket.on('exchange_status', handleStatusUpdate);

    return () => {
      Object.keys(markets).forEach(symbol => {
        unsubscribe(`orderbook:${symbol}`);
        unsubscribe(`trades:${symbol}`);
      });
      socket.off('orderbook_update', handleOrderbookUpdate);
      socket.off('trade_update', handleTradeUpdate);
      socket.off('exchange_status', handleStatusUpdate);
    };
  }, [socket, exchange, markets, subscribe, unsubscribe]);

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoUpdate || !exchangeId) return;

    updateTimeoutRef.current = setInterval(() => {
      fetchMarkets(true);
    }, updateInterval);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, exchangeId, fetchMarkets]);

  // İlk yükleme
  useEffect(() => {
    if (exchangeId) {
      fetchMarkets();
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [exchangeId, fetchMarkets]);

  // Memoized değerler
  const exchangeStats = useMemo(() => ({
    status,
    marketsCount: Object.keys(markets).length,
    lastUpdate: lastFetchRef.current,
    rateLimits: Object.fromEntries(
      Object.entries(rateLimitsRef.current).map(([method, data]) => [
        method,
        {
          remaining: RATE_LIMITS[method].requests - data.requests.length,
          reset: Math.max(
            ...data.requests,
            Date.now() - RATE_LIMITS[method].interval
          )
        }
      ])
    ),
    requestQueue: requestQueueRef.current.length,
    history: Array.from(exchangeHistoryRef.current.entries()).map(([type, events]) => ({
      type,
      events: events.slice(-100) // Son 100 event
    }))
  }), [status, markets]);

  return {
    exchange,
    markets,
    orderbook,
    trades,
    stats: exchangeStats,
    loading,
    error,
    status,
    fetchMarkets,
    fetchOrderbook,
    fetchTrades,
    createOrder,
    cancelOrder,
    makeRequest
  };
}; 