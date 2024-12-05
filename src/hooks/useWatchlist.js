import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useNotifications } from './useNotifications';

const COLLECTION_NAME = 'watchlists';
const CACHE_KEY = 'watchlist_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika
const MAX_WATCHLISTS = 10;
const MAX_COINS_PER_WATCHLIST = 100;

const ALERT_TYPES = {
  PRICE_ABOVE: 'price_above',
  PRICE_BELOW: 'price_below',
  PRICE_CHANGE: 'price_change',
  VOLUME_CHANGE: 'volume_change'
};

const SORT_OPTIONS = {
  MANUAL: 'manual',
  NAME: 'name',
  PRICE: 'price',
  MARKET_CAP: 'market_cap',
  VOLUME: 'volume',
  PRICE_CHANGE: 'price_change'
};

export const useWatchlist = (userId, options = {}) => {
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlist, setActiveWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const sortOrderRef = useRef({});

  const { marketData } = useMarketData();
  const { addNotification } = useNotifications(userId);

  const {
    enableCache = true,
    autoSync = true,
    defaultWatchlistName = 'Ana Liste',
    sortBy = SORT_OPTIONS.MANUAL,
    enableAlerts = true,
    enableNotes = true,
    enableTags = true,
    enableCategories = true
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

  // Watchlist'leri getir
  const fetchWatchlists = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setWatchlists(cached);
          setActiveWatchlist(cached[0]);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      unsubscribeRef.current = onSnapshot(q,
        (snapshot) => {
          const watchlistData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            lastModified: doc.data().lastModified?.toDate()
          }));

          setWatchlists(watchlistData);
          if (!activeWatchlist && watchlistData.length > 0) {
            setActiveWatchlist(watchlistData[0]);
          }
          
          saveToCache(watchlistData);
          lastFetchRef.current = Date.now();
          
          if (!silent) setLoading(false);
        },
        (err) => {
          console.error('Watchlist getirme hatası:', err);
          setError(err.message);
          if (!silent) setLoading(false);

          // Cache'den yükle
          const cached = loadFromCache();
          if (cached) {
            setWatchlists(cached);
            setActiveWatchlist(cached[0]);
          }
        }
      );
    } catch (err) {
      console.error('Watchlist getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setWatchlists(cached);
        setActiveWatchlist(cached[0]);
      }
    }
  }, [userId, loadFromCache, saveToCache, activeWatchlist]);

  // Watchlist oluştur
  const createWatchlist = useCallback(async (name = defaultWatchlistName, data = {}) => {
    if (watchlists.length >= MAX_WATCHLISTS) {
      throw new Error(`Maksimum watchlist sayısına (${MAX_WATCHLISTS}) ulaşıldı`);
    }

    try {
      const watchlistData = {
        name,
        userId,
        coins: [],
        alerts: {},
        notes: {},
        tags: [],
        categories: [],
        sortOrder: SORT_OPTIONS.MANUAL,
        createdAt: new Date(),
        lastModified: new Date(),
        ...data
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), watchlistData);
      return docRef.id;

    } catch (err) {
      console.error('Watchlist oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, defaultWatchlistName, watchlists.length]);

  // Coin ekle
  const addCoin = useCallback(async (watchlistId, coinId, data = {}) => {
    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (!watchlist) throw new Error('Watchlist bulunamadı');

      if (watchlist.coins.length >= MAX_COINS_PER_WATCHLIST) {
        throw new Error(`Maksimum coin sayısına (${MAX_COINS_PER_WATCHLIST}) ulaşıldı`);
      }

      if (watchlist.coins.includes(coinId)) {
        throw new Error('Coin zaten ekli');
      }

      const coinData = {
        id: coinId,
        addedAt: new Date(),
        alerts: {},
        notes: '',
        tags: [],
        ...data
      };

      await updateDoc(doc(db, COLLECTION_NAME, watchlistId), {
        coins: [...watchlist.coins, coinId],
        [`coinData.${coinId}`]: coinData,
        lastModified: new Date()
      });

      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Coin ekleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists]);

  // Coin kaldır
  const removeCoin = useCallback(async (watchlistId, coinId) => {
    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (!watchlist) throw new Error('Watchlist bulunamadı');

      await updateDoc(doc(db, COLLECTION_NAME, watchlistId), {
        coins: watchlist.coins.filter(id => id !== coinId),
        [`coinData.${coinId}`]: deleteDoc.FieldValue.delete(),
        lastModified: new Date()
      });

      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Coin kaldırma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists]);

  // Alert ekle/güncelle
  const updateAlert = useCallback(async (watchlistId, coinId, alertType, alertData) => {
    if (!enableAlerts) return;

    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (!watchlist) throw new Error('Watchlist bulunamadı');

      await updateDoc(doc(db, COLLECTION_NAME, watchlistId), {
        [`coinData.${coinId}.alerts.${alertType}`]: {
          ...alertData,
          updatedAt: new Date()
        },
        lastModified: new Date()
      });

      return true;

    } catch (err) {
      console.error('Alert güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists, enableAlerts]);

  // Not güncelle
  const updateNote = useCallback(async (watchlistId, coinId, note) => {
    if (!enableNotes) return;

    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (!watchlist) throw new Error('Watchlist bulunamadı');

      await updateDoc(doc(db, COLLECTION_NAME, watchlistId), {
        [`coinData.${coinId}.notes`]: note,
        lastModified: new Date()
      });

      return true;

    } catch (err) {
      console.error('Not güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists, enableNotes]);

  // Sıralama güncelle
  const updateSortOrder = useCallback(async (watchlistId, newOrder) => {
    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (!watchlist) throw new Error('Watchlist bulunamadı');

      sortOrderRef.current[watchlistId] = newOrder;
      
      await updateDoc(doc(db, COLLECTION_NAME, watchlistId), {
        sortOrder: newOrder,
        lastModified: new Date()
      });

      return true;

    } catch (err) {
      console.error('Sıralama güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists]);

  // Watchlist sil
  const deleteWatchlist = useCallback(async (watchlistId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, watchlistId));
      
      if (activeWatchlist?.id === watchlistId) {
        const remaining = watchlists.filter(w => w.id !== watchlistId);
        setActiveWatchlist(remaining[0] || null);
      }

      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Watchlist silme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [watchlists, activeWatchlist]);

  // Alert kontrolü
  useEffect(() => {
    if (!enableAlerts || !marketData) return;

    watchlists.forEach(watchlist => {
      watchlist.coins.forEach(coinId => {
        const coin = marketData[coinId];
        const alerts = watchlist.coinData?.[coinId]?.alerts || {};

        Object.entries(alerts).forEach(([type, alert]) => {
          if (!alert.enabled) return;

          switch (type) {
            case ALERT_TYPES.PRICE_ABOVE:
              if (coin.current_price > alert.value) {
                addNotification({
                  type: 'price_alert',
                  title: `${coin.name} fiyat alarmı`,
                  message: `${coin.symbol.toUpperCase()} fiyatı ${alert.value} üzerine çıktı`,
                  data: { coinId, price: coin.current_price }
                });
              }
              break;
            case ALERT_TYPES.PRICE_BELOW:
              if (coin.current_price < alert.value) {
                addNotification({
                  type: 'price_alert',
                  title: `${coin.name} fiyat alarmı`,
                  message: `${coin.symbol.toUpperCase()} fiyatı ${alert.value} altına düştü`,
                  data: { coinId, price: coin.current_price }
                });
              }
              break;
            // Diğer alert tipleri...
          }
        });
      });
    });
  }, [watchlists, marketData, enableAlerts, addNotification]);

  // İlk yükleme
  useEffect(() => {
    fetchWatchlists();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchWatchlists]);

  // Auto-sync
  useEffect(() => {
    if (autoSync && isDirty) {
      const syncTimeout = setTimeout(() => {
        fetchWatchlists(true);
        setIsDirty(false);
      }, 1000);

      return () => clearTimeout(syncTimeout);
    }
  }, [autoSync, isDirty, fetchWatchlists]);

  // Memoized değerler
  const stats = useMemo(() => ({
    totalWatchlists: watchlists.length,
    totalCoins: watchlists.reduce((sum, w) => sum + w.coins.length, 0),
    totalAlerts: watchlists.reduce((sum, w) => {
      return sum + Object.values(w.coinData || {}).reduce((alertSum, coin) => {
        return alertSum + Object.keys(coin.alerts || {}).length;
      }, 0);
    }, 0),
    lastModified: Math.max(...watchlists.map(w => w.lastModified?.getTime() || 0))
  }), [watchlists]);

  return {
    watchlists,
    activeWatchlist,
    stats,
    loading,
    error,
    isDirty,
    setActiveWatchlist,
    createWatchlist,
    deleteWatchlist,
    addCoin,
    removeCoin,
    updateAlert,
    updateNote,
    updateSortOrder,
    refresh: fetchWatchlists,
    lastFetch: lastFetchRef.current
  };
}; 