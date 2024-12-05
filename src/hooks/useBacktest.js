import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useIndicators } from './useIndicators';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'backtests';
const CACHE_KEY = 'backtest_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

const TEST_TYPES = {
  STRATEGY: 'strategy',
  PORTFOLIO: 'portfolio',
  INDICATOR: 'indicator',
  OPTIMIZATION: 'optimization'
};

const METRICS = {
  TOTAL_RETURN: 'total_return',
  SHARPE_RATIO: 'sharpe_ratio',
  MAX_DRAWDOWN: 'max_drawdown',
  WIN_RATE: 'win_rate',
  PROFIT_FACTOR: 'profit_factor'
};

const TIME_RANGES = {
  WEEK: '1w',
  MONTH: '1m',
  QUARTER: '3m',
  YEAR: '1y',
  ALL: 'all'
};

export const useBacktest = (userId, options = {}) => {
  const [backtests, setBacktests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const testQueueRef = useRef([]);
  const resultsHistoryRef = useRef(new Map());
  const optimizationCacheRef = useRef(new Map());
  const performanceStatsRef = useRef(new Map());

  const { marketData } = useMarketData();
  const { calculateIndicator } = useIndicators();
  const { settings } = useSettings();

  const {
    enableCache = true,
    parallelTests = 1,
    maxHistorySize = 100,
    validateStrategy = true,
    trackPerformance = true,
    enableOptimization = true,
    defaultCommission = 0.001, // %0.1
    defaultSlippage = 0.001    // %0.1
  } = options;

  // Strateji validasyonu
  const validateBacktest = useCallback((config) => {
    if (!validateStrategy) return true;

    const {
      strategy,
      timeframe,
      startDate,
      endDate,
      initialCapital,
      symbols
    } = config;

    if (!strategy || typeof strategy !== 'function') {
      throw new Error('Geçerli bir strateji fonksiyonu gerekli');
    }

    if (!timeframe || !startDate || !endDate) {
      throw new Error('Zaman aralığı parametreleri eksik');
    }

    if (!initialCapital || initialCapital <= 0) {
      throw new Error('Geçerli bir başlangıç sermayesi gerekli');
    }

    if (!symbols || !symbols.length) {
      throw new Error('En az bir sembol gerekli');
    }

    return true;
  }, [validateStrategy]);

  // Backtest oluştur
  const createBacktest = useCallback(async (config) => {
    try {
      validateBacktest(config);

      const {
        name,
        description,
        strategy,
        symbols,
        timeframe,
        startDate,
        endDate,
        initialCapital,
        commission = defaultCommission,
        slippage = defaultSlippage,
        indicators = [],
        params = {}
      } = config;

      const backtest = {
        userId,
        name,
        description,
        type: TEST_TYPES.STRATEGY,
        symbols,
        timeframe,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital,
        commission,
        slippage,
        indicators,
        params,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const testDoc = await addDoc(collection(db, COLLECTION_NAME), backtest);
      
      // Test kuyruğuna ekle
      testQueueRef.current.push({
        id: testDoc.id,
        config: {
          ...backtest,
          strategy
        }
      });

      return {
        ...backtest,
        id: testDoc.id
      };

    } catch (err) {
      console.error('Backtest oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, validateBacktest, defaultCommission, defaultSlippage]);

  // Backtest çalıştır
  const runBacktest = useCallback(async (testId) => {
    try {
      const test = testQueueRef.current.find(t => t.id === testId);
      if (!test) {
        throw new Error('Test bulunamadı');
      }

      setActiveTest(testId);
      setProgress(0);

      const {
        symbols,
        timeframe,
        startDate,
        endDate,
        initialCapital,
        commission,
        slippage,
        indicators,
        params,
        strategy
      } = test.config;

      // Market verilerini al
      const marketDataPromises = symbols.map(symbol =>
        marketData.getCandles(symbol, timeframe, startDate, endDate)
      );
      
      const candleData = await Promise.all(marketDataPromises);
      
      // İndikatörleri hesapla
      const indicatorPromises = indicators.map(indicator =>
        calculateIndicator(indicator.type, {
          ...indicator.params,
          candles: candleData
        })
      );

      const indicatorData = await Promise.all(indicatorPromises);

      // Stratejiyi çalıştır
      let capital = initialCapital;
      let positions = [];
      let trades = [];
      let equity = [{ timestamp: startDate, value: capital }];

      const totalBars = candleData[0].length;
      
      for (let i = 0; i < totalBars; i++) {
        setProgress((i / totalBars) * 100);

        const currentBars = candleData.map(data => data[i]);
        const currentIndicators = indicatorData.map(data => data[i]);

        // Strateji sinyallerini al
        const signals = await strategy({
          bars: currentBars,
          indicators: currentIndicators,
          positions,
          capital,
          params
        });

        // Sinyalleri işle
        for (const signal of signals) {
          const { symbol, type, price, size } = signal;
          
          // Komisyon ve slippage hesapla
          const effectivePrice = type === 'buy'
            ? price * (1 + slippage)
            : price * (1 - slippage);
          
          const cost = size * effectivePrice;
          const commissionCost = cost * commission;

          // Trade oluştur
          const trade = {
            symbol,
            type,
            price: effectivePrice,
            size,
            cost,
            commission: commissionCost,
            timestamp: currentBars[0].timestamp
          };

          trades.push(trade);

          // Pozisyonları güncelle
          if (type === 'buy') {
            positions.push({
              symbol,
              size,
              entryPrice: effectivePrice,
              timestamp: currentBars[0].timestamp
            });
            capital -= (cost + commissionCost);
          } else {
            const position = positions.find(p => p.symbol === symbol);
            if (position) {
              const pnl = (effectivePrice - position.entryPrice) * size;
              capital += pnl - commissionCost;
              positions = positions.filter(p => p !== position);
            }
          }
        }

        // Equity eğrisini güncelle
        equity.push({
          timestamp: currentBars[0].timestamp,
          value: capital + positions.reduce((sum, pos) => {
            const currentPrice = currentBars.find(b => b.symbol === pos.symbol).close;
            return sum + (pos.size * currentPrice);
          }, 0)
        });
      }

      // Sonuçları hesapla
      const results = calculateResults({
        trades,
        equity,
        initialCapital,
        startDate,
        endDate
      });

      // Sonuçları kaydet
      await updateDoc(doc(db, COLLECTION_NAME, testId), {
        status: 'completed',
        progress: 100,
        results,
        updatedAt: new Date()
      });

      // History güncelle
      resultsHistoryRef.current.set(testId, {
        config: test.config,
        results,
        timestamp: Date.now()
      });

      setResults(prev => ({
        ...prev,
        [testId]: results
      }));

      return results;

    } catch (err) {
      console.error('Backtest çalıştırma hatası:', err);
      
      await updateDoc(doc(db, COLLECTION_NAME, testId), {
        status: 'failed',
        error: err.message,
        updatedAt: new Date()
      });

      setError(err.message);
      throw err;
    } finally {
      setActiveTest(null);
      setProgress(0);
    }
  }, [marketData, calculateIndicator]);

  // Optimizasyon
  const optimizeStrategy = useCallback(async (testId, paramRanges) => {
    if (!enableOptimization) return null;

    try {
      const test = testQueueRef.current.find(t => t.id === testId);
      if (!test) {
        throw new Error('Test bulunamadı');
      }

      // Parametre kombinasyonlarını oluştur
      const combinations = generateParameterCombinations(paramRanges);
      const results = [];

      for (let i = 0; i < combinations.length; i++) {
        setProgress((i / combinations.length) * 100);

        const params = combinations[i];
        
        // Cache kontrolü
        const cacheKey = `${testId}_${JSON.stringify(params)}`;
        const cached = optimizationCacheRef.current.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          results.push(cached.results);
          continue;
        }

        // Test çalıştır
        const result = await runBacktest(testId, {
          ...test.config,
          params
        });

        results.push(result);

        // Cache'e kaydet
        if (enableCache) {
          optimizationCacheRef.current.set(cacheKey, {
            results: result,
            timestamp: Date.now()
          });
        }
      }

      // En iyi sonuçları bul
      const optimized = results.sort((a, b) =>
        b[METRICS.SHARPE_RATIO] - a[METRICS.SHARPE_RATIO]
      ).slice(0, 10);

      return optimized;

    } catch (err) {
      console.error('Optimizasyon hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setProgress(0);
    }
  }, [enableOptimization, enableCache, runBacktest]);

  // Test kuyruğunu işle
  useEffect(() => {
    if (!testQueueRef.current.length || activeTest) return;

    const processQueue = async () => {
      const test = testQueueRef.current[0];
      await runBacktest(test.id);
      testQueueRef.current.shift();
    };

    processQueue();
  }, [activeTest, runBacktest]);

  // Backtestleri getir
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tests = [];
      snapshot.forEach(doc => {
        tests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setBacktests(tests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Memoized değerler
  const backtestStats = useMemo(() => ({
    total: backtests.length,
    completed: backtests.filter(t => t.status === 'completed').length,
    failed: backtests.filter(t => t.status === 'failed').length,
    byType: Object.fromEntries(
      Object.values(TEST_TYPES).map(type => [
        type,
        backtests.filter(t => t.type === type).length
      ])
    ),
    results: Object.values(results),
    history: Array.from(resultsHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data
    })).slice(-maxHistorySize)
  }), [backtests, results, maxHistorySize]);

  return {
    backtests,
    activeTest,
    results,
    stats: backtestStats,
    loading,
    error,
    progress,
    createBacktest,
    runBacktest,
    optimizeStrategy
  };
};

// Yardımcı fonksiyonlar
const calculateResults = (data) => {
  // Sonuç hesaplama implementasyonu
};

const generateParameterCombinations = (ranges) => {
  // Parametre kombinasyonları oluşturma implementasyonu
}; 