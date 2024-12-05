import { useState, useCallback, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'watchlists';
const CACHE_KEY = 'watchlist_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export const useWatchlistData = (userId, options = {}) => {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);

  const {
    enableCache = true,
    refreshInterval = 0,
    sortField = 'lastModified',
    sortDirection = 'desc',
    filterPublic = false,
    includeDeleted = false
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
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
  }, [enableCache]);

  const saveToCache = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache]);

  // Watchlist verilerini getir
  const fetchWatchlists = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Query oluştur
      let q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      // Filtreleme
      if (!includeDeleted) {
        q = query(q, where('deleted', '==', false));
      }

      if (filterPublic) {
        q = query(q, where('isPublic', '==', true));
      }

      // Sıralama
      q = query(q, orderBy(sortField, sortDirection));

      // Realtime listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = onSnapshot(q, 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastModified: doc.data().lastModified?.toDate().toISOString()
          }));

          setWatchlists(data);
          saveToCache(data);
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
      }
    }
  }, [userId, sortField, sortDirection, filterPublic, includeDeleted, loadFromCache, saveToCache]);

  // İlk yükleme ve refresh interval
  useEffect(() => {
    fetchWatchlists();

    // Refresh interval
    let intervalId;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchWatchlists(true);
      }, refreshInterval);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchWatchlists, refreshInterval]);

  // Watchlist oluştur
  const createWatchlist = useCallback(async (data) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        userId,
        createdAt: new Date(),
        lastModified: new Date(),
        deleted: false
      });
      return docRef.id;
    } catch (err) {
      console.error('Watchlist oluşturma hatası:', err);
      throw err;
    }
  }, [userId]);

  // Watchlist güncelle
  const updateWatchlist = useCallback(async (id, data) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        lastModified: new Date()
      });
    } catch (err) {
      console.error('Watchlist güncelleme hatası:', err);
      throw err;
    }
  }, []);

  // Watchlist sil
  const deleteWatchlist = useCallback(async (id, hardDelete = false) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      if (hardDelete) {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, {
          deleted: true,
          lastModified: new Date()
        });
      }
    } catch (err) {
      console.error('Watchlist silme hatası:', err);
      throw err;
    }
  }, []);

  // Watchlist geri yükle
  const restoreWatchlist = useCallback(async (id) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        deleted: false,
        lastModified: new Date()
      });
    } catch (err) {
      console.error('Watchlist geri yükleme hatası:', err);
      throw err;
    }
  }, []);

  return {
    watchlists,
    loading,
    error,
    refresh: fetchWatchlists,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    restoreWatchlist,
    lastFetch: lastFetchRef.current
  };
}; 