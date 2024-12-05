import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSocket } from './useSocket';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'market_data';
const CACHE_KEY = 'market_data_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

const DATA_TYPES = {
  PRICE: 'price',
  VOLUME: 'volume',
  MARKET_CAP: 'market_cap',
  SUPPLY: 'supply',
  SOCIAL: 'social',
  DEVELOPER: 'developer'
};

const TIME_FRAMES = {
  MINUTE_1: '1m',
  MINUTE_5: '5m',
  MINUTE_15: '15m',
  MINUTE_30: '30m',
  HOUR_1: '1h',
  HOUR_4: '4h',
  HOUR_12: '12h',
  DAY_1: '1d',
  WEEK_1: '1w'
};

const INDICATORS = {
  RSI: 'rsi',
  MACD: 'macd',
  BB: 'bollinger_bands',
  EMA: 'ema',
  SMA: 'sma',
  VOLUME: 'volume_profile'
};

export const useMarketData = (options = {}) => {
  const [marketData, setMarketData] = useState({});
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [timeframe, setTimeframe] = useState(TIME_FRAMES.MINUTE_5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const lastFetchRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const dataHistoryRef = useRef(new Map());
  const indicatorCacheRef = useRef(new Map());

  const { socket, subscribe, unsubscribe } = useSocket();
  const { settings } = useSettings();

  const {
    enableCache = true,
    autoUpdate = true,
    updateInterval = 5000, // 5 saniye
    includedTypes = Object.values(DATA_TYPES),
    includedIndicators = Object.values(INDICATORS),
    maxCoins = 100,
    maxHistory = 1000,
    aggregateData = true,
    calculateIndicators = true
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${timeframe}`);
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
  }, [enableCache, timeframe]);

  const saveToCache = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${timeframe}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, timeframe]);

  // Teknik indikatör hesaplama
  const calculateIndicator = useCallback((data, indicator, params = {}) => {
    const cacheKey = `${indicator}_${JSON.stringify(params)}`;
    
    // Cache kontrol
    if (indicatorCacheRef.current.has(cacheKey)) {
      return indicatorCacheRef.current.get(cacheKey);
    }

    let result;
    switch (indicator) {
      case INDICATORS.RSI:
        // RSI hesapla
        break;
      case INDICATORS.MACD:
        // MACD hesapla
        break;
      case INDICATORS.BB:
        // Bollinger Bands hesapla
        break;
      case INDICATORS.EMA:
        // EMA hesapla
        break;
      case INDICATORS.SMA:
        // SMA hesapla
        break;
      case INDICATORS.VOLUME:
        // Volume Profile hesapla
        break;
      default:
        throw new Error('Desteklenmeyen indikatör');
    }

    // Sonucu cache'e kaydet
    indicatorCacheRef.current.set(cacheKey, result);
    return result;
  }, []);

  // Veri agregasyonu
  const aggregateMarketData = useCallback((data) => {
    if (!aggregateData) return data;

    const aggregated = {};
    Object.entries(data).forEach(([coinId, coinData]) => {
      const timeframes = {};
      
      // Her timeframe için veriyi topla
      Object.entries(coinData.ohlcv || {}).forEach(([tf, ohlcv]) => {
        timeframes[tf] = {
          open: ohlcv[0],
          high: Math.max(...ohlcv.map(c => c[2])),
          low: Math.min(...ohlcv.map(c => c[3])),
          close: ohlcv[ohlcv.length - 1][4],
          volume: ohlcv.reduce((sum, c) => sum + c[5], 0)
        };
      });

      aggregated[coinId] = {
        ...coinData,
        timeframes,
        indicators: calculateIndicators ? Object.fromEntries(
          includedIndicators.map(indicator => [
            indicator,
            calculateIndicator(coinData, indicator)
          ])
        ) : undefined
      };
    });

    return aggregated;
  }, [aggregateData, calculateIndicators, includedIndicators, calculateIndicator]);

  // WebSocket event handler'ları
  const handlePriceUpdate = useCallback((data) => {
    setMarketData(prev => ({
      ...prev,
      [data.coinId]: {
        ...prev[data.coinId],
        current_price: data.price,
        last_updated: new Date()
      }
    }));

    // Geçmişe ekle
    if (!dataHistoryRef.current.has(data.coinId)) {
      dataHistoryRef.current.set(data.coinId, []);
    }
    const history = dataHistoryRef.current.get(data.coinId);
    history.push({
      timestamp: Date.now(),
      price: data.price
    });
    // Maksimum geçmiş boyutunu kontrol et
    if (history.length > maxHistory) {
      history.shift();
    }

    setIsDirty(true);
  }, [maxHistory]);

  // Market verilerini getir
  const fetchMarketData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setMarketData(cached);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('type', 'in', includedTypes),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const marketData = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        marketData[data.coinId] = data;
      });

      const aggregatedData = aggregateMarketData(marketData);
      setMarketData(aggregatedData);
      saveToCache(aggregatedData);
      lastFetchRef.current = Date.now();
      setIsDirty(false);

      if (!silent) setLoading(false);

    } catch (err) {
      console.error('Market verisi getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setMarketData(cached);
      }
    }
  }, [includedTypes, aggregateMarketData, loadFromCache, saveToCache]);

  // WebSocket abonelikleri
  useEffect(() => {
    if (!socket || selectedCoins.length === 0) return;

    // Coin'lere abone ol
    selectedCoins.forEach(coinId => {
      subscribe(`price:${coinId}`);
      subscribe(`volume:${coinId}`);
    });

    // Event listener'ları ekle
    socket.on('price_update', handlePriceUpdate);

    return () => {
      selectedCoins.forEach(coinId => {
        unsubscribe(`price:${coinId}`);
        unsubscribe(`volume:${coinId}`);
      });
      socket.off('price_update', handlePriceUpdate);
    };
  }, [socket, selectedCoins, subscribe, unsubscribe, handlePriceUpdate]);

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoUpdate) return;

    updateTimeoutRef.current = setInterval(() => {
      fetchMarketData(true);
    }, updateInterval);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchMarketData]);

  // İlk yükleme
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Memoized değerler
  const marketStats = useMemo(() => ({
    totalCoins: Object.keys(marketData).length,
    totalVolume: Object.values(marketData).reduce((sum, coin) => 
      sum + (coin.total_volume || 0), 0),
    marketCap: Object.values(marketData).reduce((sum, coin) => 
      sum + (coin.market_cap || 0), 0),
    dominance: Object.entries(marketData)
      .sort((a, b) => (b[1].market_cap || 0) - (a[1].market_cap || 0))
      .slice(0, 10)
      .map(([coinId, data]) => ({
        coinId,
        percentage: (data.market_cap || 0) * 100 / 
          Object.values(marketData).reduce((sum, coin) => 
            sum + (coin.market_cap || 0), 0)
      })),
    history: Array.from(dataHistoryRef.current.entries()).map(([coinId, history]) => ({
      coinId,
      history: history.slice(-100) // Son 100 veri
    })),
    lastUpdate: lastFetchRef.current
  }), [marketData]);

  return {
    marketData,
    stats: marketStats,
    selectedCoins,
    timeframe,
    loading,
    error,
    isDirty,
    setSelectedCoins,
    setTimeframe,
    refresh: fetchMarketData,
    lastFetch: lastFetchRef.current
  };
}; 