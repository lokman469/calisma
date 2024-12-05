import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useExchange } from './useExchange';

const COLLECTION_NAME = 'portfolios';
const CACHE_KEY = 'portfolio_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

const PORTFOLIO_TYPES = {
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures',
  LENDING: 'lending',
  STAKING: 'staking'
};

const ASSET_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  STAKED: 'staked',
  LENDING: 'lending',
  BORROWED: 'borrowed'
};

const RISK_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

export const usePortfolio = (userId, options = {}) => {
  const [portfolio, setPortfolio] = useState(null);
  const [assets, setAssets] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const performanceHistoryRef = useRef(new Map());

  const { marketData } = useMarketData();
  const { exchangeData } = useExchange();

  const {
    enableCache = true,
    autoUpdate = true,
    updateInterval = 60000, // 1 dakika
    includedTypes = Object.values(PORTFOLIO_TYPES),
    calculatePerformance = true,
    trackHistory = true,
    maxHistory = 1000,
    defaultType = PORTFOLIO_TYPES.SPOT,
    riskLevel = RISK_LEVELS.MEDIUM
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${userId}`);
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
  }, [enableCache, userId]);

  const saveToCache = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, userId]);

  // Performans hesaplama
  const calculateAssetPerformance = useCallback((asset) => {
    const currentPrice = marketData[asset.coinId]?.current_price || 0;
    const initialValue = asset.purchasePrice * asset.amount;
    const currentValue = currentPrice * asset.amount;
    
    return {
      initialValue,
      currentValue,
      profitLoss: currentValue - initialValue,
      profitLossPercentage: initialValue > 0 
        ? ((currentValue - initialValue) / initialValue) * 100 
        : 0,
      roi: initialValue > 0 
        ? (currentValue / initialValue - 1) * 100 
        : 0
    };
  }, [marketData]);

  // Portföy performansı hesaplama
  const calculatePortfolioPerformance = useCallback(() => {
    if (!calculatePerformance) return {};

    const performance = {
      totalValue: 0,
      totalCost: 0,
      profitLoss: 0,
      profitLossPercentage: 0,
      roi: 0,
      assets: {}
    };

    assets.forEach(asset => {
      const assetPerformance = calculateAssetPerformance(asset);
      performance.assets[asset.coinId] = assetPerformance;
      performance.totalValue += assetPerformance.currentValue;
      performance.totalCost += assetPerformance.initialValue;
    });

    performance.profitLoss = performance.totalValue - performance.totalCost;
    performance.profitLossPercentage = performance.totalCost > 0 
      ? (performance.profitLoss / performance.totalCost) * 100 
      : 0;
    performance.roi = performance.totalCost > 0 
      ? (performance.totalValue / performance.totalCost - 1) * 100 
      : 0;

    // Performans geçmişini güncelle
    if (trackHistory) {
      const historyEntry = {
        timestamp: Date.now(),
        ...performance
      };
      
      Object.entries(performance.assets).forEach(([coinId, data]) => {
        if (!performanceHistoryRef.current.has(coinId)) {
          performanceHistoryRef.current.set(coinId, []);
        }
        const history = performanceHistoryRef.current.get(coinId);
        history.push({
          timestamp: Date.now(),
          ...data
        });
        if (history.length > maxHistory) {
          history.shift();
        }
      });
    }

    return performance;
  }, [assets, calculatePerformance, trackHistory, maxHistory, calculateAssetPerformance]);

  // Portföy getir
  const fetchPortfolio = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setPortfolio(cached.portfolio);
          setAssets(cached.assets);
          setPerformance(calculatePortfolioPerformance());
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('type', 'in', includedTypes),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const portfolioData = snapshot.docs[0]?.data() || {
          userId,
          type: defaultType,
          riskLevel,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const assetsData = portfolioData.assets || [];

        setPortfolio(portfolioData);
        setAssets(assetsData);
        setPerformance(calculatePortfolioPerformance());
        
        saveToCache({
          portfolio: portfolioData,
          assets: assetsData
        });
        
        lastFetchRef.current = Date.now();
        setIsDirty(false);
      });

      unsubscribeRef.current = unsubscribe;
      if (!silent) setLoading(false);

    } catch (err) {
      console.error('Portföy getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setPortfolio(cached.portfolio);
        setAssets(cached.assets);
        setPerformance(calculatePortfolioPerformance());
      }
    }
  }, [userId, includedTypes, defaultType, riskLevel, loadFromCache, saveToCache, calculatePortfolioPerformance]);

  // Asset ekle/güncelle
  const updateAsset = useCallback(async (assetData) => {
    try {
      const { coinId, amount, purchasePrice, type = defaultType, status = ASSET_STATUS.ACTIVE } = assetData;

      if (!coinId || !amount || !purchasePrice) {
        throw new Error('Geçersiz asset bilgileri');
      }

      const updatedAssets = [...assets];
      const existingIndex = assets.findIndex(a => a.coinId === coinId);

      if (existingIndex >= 0) {
        updatedAssets[existingIndex] = {
          ...updatedAssets[existingIndex],
          ...assetData,
          updatedAt: new Date()
        };
      } else {
        updatedAssets.push({
          coinId,
          amount,
          purchasePrice,
          type,
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await updateDoc(doc(db, COLLECTION_NAME, portfolio.id), {
        assets: updatedAssets,
        updatedAt: new Date()
      });

      return true;

    } catch (err) {
      console.error('Asset güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [portfolio, assets, defaultType]);

  // Asset sil
  const deleteAsset = useCallback(async (coinId) => {
    try {
      const updatedAssets = assets.filter(a => a.coinId !== coinId);

      await updateDoc(doc(db, COLLECTION_NAME, portfolio.id), {
        assets: updatedAssets,
        updatedAt: new Date()
      });

      performanceHistoryRef.current.delete(coinId);
      return true;

    } catch (err) {
      console.error('Asset silme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [portfolio, assets]);

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoUpdate) return;

    updateTimeoutRef.current = setInterval(() => {
      fetchPortfolio(true);
    }, updateInterval);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchPortfolio]);

  // İlk yükleme
  useEffect(() => {
    fetchPortfolio();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [fetchPortfolio]);

  // Memoized değerler
  const portfolioStats = useMemo(() => ({
    totalAssets: assets.length,
    totalValue: performance.totalValue || 0,
    profitLoss: performance.profitLoss || 0,
    roi: performance.roi || 0,
    byType: Object.fromEntries(
      Object.values(PORTFOLIO_TYPES).map(type => [
        type,
        assets.filter(a => a.type === type).length
      ])
    ),
    byStatus: Object.fromEntries(
      Object.values(ASSET_STATUS).map(status => [
        status,
        assets.filter(a => a.status === status).length
      ])
    ),
    topPerformers: Object.entries(performance.assets || {})
      .sort(([, a], [, b]) => b.roi - a.roi)
      .slice(0, 5)
      .map(([coinId, data]) => ({
        coinId,
        ...data
      })),
    history: Array.from(performanceHistoryRef.current.entries()).map(([coinId, history]) => ({
      coinId,
      history: history.slice(-100) // Son 100 veri
    })),
    lastUpdate: lastFetchRef.current
  }), [assets, performance]);

  return {
    portfolio,
    assets,
    performance,
    stats: portfolioStats,
    loading,
    error,
    isDirty,
    updateAsset,
    deleteAsset,
    refresh: fetchPortfolio,
    lastFetch: lastFetchRef.current
  };
}; 