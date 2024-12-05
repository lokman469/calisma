import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useIndicators } from './useIndicators';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'scanners';
const CACHE_KEY = 'scanner_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

const SCANNER_TYPES = {
  TECHNICAL: 'technical',
  FUNDAMENTAL: 'fundamental',
  VOLATILITY: 'volatility',
  VOLUME: 'volume',
  CUSTOM: 'custom'
};

const FILTER_TYPES = {
  INDICATOR: 'indicator',
  PRICE: 'price',
  VOLUME: 'volume',
  PATTERN: 'pattern',
  CUSTOM: 'custom'
};

const TIMEFRAMES = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d'
};

export const useScanner = (userId, options = {}) => {
  const [scanners, setScanners] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  
  const scanQueueRef = useRef([]);
  const resultsHistoryRef = useRef(new Map());
  const filterCacheRef = useRef(new Map());
  const customFiltersRef = useRef(new Map());

  const { marketData } = useMarketData();
  const { calculateIndicator } = useIndicators();
  const { settings } = useSettings();

  const {
    enableCache = true,
    maxScanners = 20,
    maxResults = 100,
    validateFilters = true,
    autoScan = true,
    scanInterval = 60000, // 1 dakika
    defaultTimeframe = TIMEFRAMES.H1,
    parallelScans = 3
  } = options;

  // Scanner oluştur
  const createScanner = useCallback(async (config) => {
    try {
      const {
        name,
        description,
        type = SCANNER_TYPES.TECHNICAL,
        markets = ['crypto', 'forex'],
        timeframe = defaultTimeframe,
        filters = [],
        sortBy = 'volume',
        ascending = false,
        active = true
      } = config;

      // Validasyonlar
      if (scanners.length >= maxScanners) {
        throw new Error('Maksimum scanner limitine ulaşıldı');
      }

      if (validateFilters) {
        filters.forEach(filter => {
          if (!Object.values(FILTER_TYPES).includes(filter.type)) {
            throw new Error(`Geçersiz filtre tipi: ${filter.type}`);
          }
        });
      }

      const scanner = {
        userId,
        name,
        description,
        type,
        markets,
        timeframe,
        filters,
        sortBy,
        ascending,
        active,
        lastScan: null,
        resultsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const scannerDoc = await addDoc(collection(db, COLLECTION_NAME), scanner);
      
      return {
        ...scanner,
        id: scannerDoc.id
      };

    } catch (err) {
      console.error('Scanner oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [scanners, maxScanners, validateFilters, userId, defaultTimeframe]);

  // Tarama yap
  const scan = useCallback(async (scannerId) => {
    try {
      const scanner = scanners.find(s => s.id === scannerId);
      if (!scanner) {
        throw new Error('Scanner bulunamadı');
      }

      setScanning(true);

      const {
        markets,
        timeframe,
        filters,
        sortBy,
        ascending
      } = scanner;

      // Market sembollerini al
      const symbols = await marketData.getSymbols(markets);
      
      // Paralel tarama için sembolleri böl
      const chunks = [];
      for (let i = 0; i < symbols.length; i += parallelScans) {
        chunks.push(symbols.slice(i, i + parallelScans));
      }

      const allResults = [];

      // Her chunk için tarama yap
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async symbol => {
          try {
            // Market verilerini al
            const candles = await marketData.getCandles(symbol, timeframe);
            if (!candles || !candles.length) return null;

            // Filtreleri uygula
            const filterResults = await applyFilters(filters, candles);
            if (!filterResults.passed) return null;

            // Sonuç objesi
            return {
              symbol,
              timeframe,
              price: candles[candles.length - 1].close,
              volume: candles[candles.length - 1].volume,
              change: calculateChange(candles),
              indicators: filterResults.indicators,
              patterns: filterResults.patterns,
              score: filterResults.score,
              timestamp: Date.now()
            };
          } catch (err) {
            console.warn(`${symbol} tarama hatası:`, err);
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        allResults.push(...chunkResults.filter(Boolean));
      }

      // Sonuçları sırala
      const sortedResults = allResults
        .sort((a, b) => {
          const aValue = a[sortBy] || 0;
          const bValue = b[sortBy] || 0;
          return ascending ? aValue - bValue : bValue - aValue;
        })
        .slice(0, maxResults);

      // Sonuçları kaydet
      await updateDoc(doc(db, COLLECTION_NAME, scannerId), {
        lastScan: new Date(),
        resultsCount: sortedResults.length,
        updatedAt: new Date()
      });

      // History güncelle
      resultsHistoryRef.current.set(scannerId, {
        results: sortedResults,
        timestamp: Date.now()
      });

      setResults(prev => ({
        ...prev,
        [scannerId]: sortedResults
      }));

      return sortedResults;

    } catch (err) {
      console.error('Tarama hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setScanning(false);
    }
  }, [scanners, marketData, parallelScans, maxResults]);

  // Filtreleri uygula
  const applyFilters = useCallback(async (filters, candles) => {
    try {
      const results = {
        passed: true,
        indicators: {},
        patterns: [],
        score: 0
      };

      for (const filter of filters) {
        const { type, params } = filter;

        // Cache kontrolü
        const cacheKey = `${type}_${JSON.stringify(params)}`;
        const cached = filterCacheRef.current.get(cacheKey);
        if (enableCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          Object.assign(results, cached.results);
          continue;
        }

        switch (type) {
          case FILTER_TYPES.INDICATOR:
            const indicator = await calculateIndicator(params.type, {
              candles,
              ...params
            });
            results.indicators[params.type] = indicator;
            results.passed = results.passed && evaluateIndicator(indicator, params);
            break;

          case FILTER_TYPES.PRICE:
            const priceCondition = evaluatePriceCondition(candles, params);
            results.passed = results.passed && priceCondition;
            break;

          case FILTER_TYPES.VOLUME:
            const volumeCondition = evaluateVolumeCondition(candles, params);
            results.passed = results.passed && volumeCondition;
            break;

          case FILTER_TYPES.PATTERN:
            const patterns = findPatterns(candles, params);
            results.patterns.push(...patterns);
            results.passed = results.passed && patterns.length > 0;
            break;

          case FILTER_TYPES.CUSTOM:
            if (customFiltersRef.current.has(params.name)) {
              const customFilter = customFiltersRef.current.get(params.name);
              const customResult = await customFilter(candles, params);
              results.passed = results.passed && customResult.passed;
              Object.assign(results, customResult);
            }
            break;
        }

        // Sonuçları cache'le
        if (enableCache) {
          filterCacheRef.current.set(cacheKey, {
            results,
            timestamp: Date.now()
          });
        }
      }

      return results;

    } catch (err) {
      console.error('Filtre uygulama hatası:', err);
      throw err;
    }
  }, [calculateIndicator, enableCache]);

  // Özel filtre ekle
  const addCustomFilter = useCallback((name, filterFn) => {
    if (typeof filterFn !== 'function') {
      throw new Error('Filter bir fonksiyon olmalı');
    }
    
    customFiltersRef.current.set(name, filterFn);
  }, []);

  // Otomatik tarama
  useEffect(() => {
    if (!autoScan) return;

    const scanActive = async () => {
      try {
        const activeScanners = scanners.filter(s => s.active);
        for (const scanner of activeScanners) {
          await scan(scanner.id);
        }
      } catch (err) {
        console.error('Otomatik tarama hatası:', err);
      }
    };

    const interval = setInterval(scanActive, scanInterval);
    return () => clearInterval(interval);
  }, [autoScan, scanInterval, scanners, scan]);

  // Scanner'ları getir
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scannerData = [];
      snapshot.forEach(doc => {
        scannerData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setScanners(scannerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Memoized değerler
  const scannerStats = useMemo(() => ({
    total: scanners.length,
    active: scanners.filter(s => s.active).length,
    byType: Object.fromEntries(
      Object.values(SCANNER_TYPES).map(type => [
        type,
        scanners.filter(s => s.type === type).length
      ])
    ),
    results: Object.values(results).reduce((sum, r) => sum + r.length, 0),
    history: Array.from(resultsHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data
    }))
  }), [scanners, results]);

  return {
    scanners,
    results,
    stats: scannerStats,
    loading,
    error,
    scanning,
    createScanner,
    scan,
    addCustomFilter
  };
};

// Yardımcı fonksiyonlar
const calculateChange = (candles) => {
  // Değişim hesaplama implementasyonu
};

const evaluateIndicator = (indicator, params) => {
  // İndikatör değerlendirme implementasyonu
};

const evaluatePriceCondition = (candles, params) => {
  // Fiyat koşulu değerlendirme implementasyonu
};

const evaluateVolumeCondition = (candles, params) => {
  // Hacim koşulu değerlendirme implementasyonu
};

const findPatterns = (candles, params) => {
  // Pattern bulma implementasyonu
}; 