import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useSettings } from './useSettings';

const CACHE_KEY = 'search_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika
const MIN_SEARCH_LENGTH = 2;
const MAX_RECENT_SEARCHES = 10;
const DEBOUNCE_DELAY = 300;

const SEARCH_TYPES = {
  COINS: 'coins',
  NEWS: 'news',
  USERS: 'users',
  WATCHLISTS: 'watchlists',
  PORTFOLIOS: 'portfolios'
};

const SORT_OPTIONS = {
  RELEVANCE: 'relevance',
  MARKET_CAP: 'market_cap',
  VOLUME: 'volume',
  PRICE_CHANGE: 'price_change',
  DATE: 'date'
};

export const useSearch = (userId, options = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState({});
  const [page, setPage] = useState(1);
  
  const lastQueryRef = useRef('');
  const searchTimeoutRef = useRef(null);
  const lastDocsRef = useRef({});
  const abortControllerRef = useRef(null);
  const lastSearchRef = useRef(null);

  const { marketData } = useMarketData();
  const { settings } = useSettings(userId);

  const {
    enableCache = true,
    saveRecentSearches = true,
    searchTypes = Object.values(SEARCH_TYPES),
    pageSize = 20,
    sortBy = SORT_OPTIONS.RELEVANCE,
    language = settings?.language || 'tr',
    includeMetadata = true,
    filterByWatchlist = false,
    fuzzySearch = true
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback((searchQuery) => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${searchQuery}_${language}`);
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
  }, [enableCache, language]);

  const saveToCache = useCallback((searchQuery, data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${searchQuery}_${language}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, language]);

  // Son aramaları yükle/kaydet
  const loadRecentSearches = useCallback(() => {
    if (!saveRecentSearches) return;
    
    try {
      const saved = localStorage.getItem(`recent_searches_${userId}`);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Son aramalar yükleme hatası:', err);
    }
  }, [saveRecentSearches, userId]);

  const saveRecentSearch = useCallback((searchQuery) => {
    if (!saveRecentSearches || !searchQuery) return;
    
    try {
      setRecentSearches(prev => {
        const updated = [
          searchQuery,
          ...prev.filter(q => q !== searchQuery)
        ].slice(0, MAX_RECENT_SEARCHES);
        
        localStorage.setItem(`recent_searches_${userId}`, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.warn('Son arama kaydetme hatası:', err);
    }
  }, [saveRecentSearches, userId]);

  // Coin arama
  const searchCoins = useCallback(async (searchQuery, isLoadMore = false) => {
    if (!searchTypes.includes(SEARCH_TYPES.COINS)) return {};

    try {
      const coins = Object.values(marketData).filter(coin => {
        const searchLower = searchQuery.toLowerCase();
        return (
          coin.id.includes(searchLower) ||
          coin.symbol.toLowerCase().includes(searchLower) ||
          coin.name.toLowerCase().includes(searchLower)
        );
      });

      // Sıralama
      const sortedCoins = coins.sort((a, b) => {
        switch (sortBy) {
          case SORT_OPTIONS.MARKET_CAP:
            return b.market_cap - a.market_cap;
          case SORT_OPTIONS.VOLUME:
            return b.total_volume - a.total_volume;
          case SORT_OPTIONS.PRICE_CHANGE:
            return Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h);
          default:
            return 0;
        }
      });

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedCoins = sortedCoins.slice(start, end);

      return {
        items: paginatedCoins,
        hasMore: end < sortedCoins.length
      };
    } catch (err) {
      console.error('Coin arama hatası:', err);
      throw err;
    }
  }, [searchTypes, marketData, sortBy, page, pageSize]);

  // Haber arama
  const searchNews = useCallback(async (searchQuery, isLoadMore = false) => {
    if (!searchTypes.includes(SEARCH_TYPES.NEWS)) return {};

    try {
      let q = query(
        collection(db, 'news'),
        where('language', '==', language),
        orderBy('publishedAt', 'desc')
      );

      if (isLoadMore && lastDocsRef.current.news) {
        q = query(q, startAfter(lastDocsRef.current.news));
      }

      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const news = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(article => {
          const searchLower = searchQuery.toLowerCase();
          return (
            article.title.toLowerCase().includes(searchLower) ||
            article.description.toLowerCase().includes(searchLower)
          );
        });

      lastDocsRef.current.news = snapshot.docs[snapshot.docs.length - 1];

      return {
        items: news,
        hasMore: news.length === pageSize
      };
    } catch (err) {
      console.error('Haber arama hatası:', err);
      throw err;
    }
  }, [searchTypes, language, pageSize]);

  // Kullanıcı arama
  const searchUsers = useCallback(async (searchQuery, isLoadMore = false) => {
    if (!searchTypes.includes(SEARCH_TYPES.USERS)) return {};

    try {
      let q = query(
        collection(db, 'users'),
        where('searchTerms', 'array-contains', searchQuery.toLowerCase()),
        orderBy('username'),
        limit(pageSize)
      );

      if (isLoadMore && lastDocsRef.current.users) {
        q = query(q, startAfter(lastDocsRef.current.users));
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      lastDocsRef.current.users = snapshot.docs[snapshot.docs.length - 1];

      return {
        items: users,
        hasMore: users.length === pageSize
      };
    } catch (err) {
      console.error('Kullanıcı arama hatası:', err);
      throw err;
    }
  }, [searchTypes, pageSize]);

  // Arama işlemi
  const performSearch = useCallback(async (searchQuery, isLoadMore = false) => {
    if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults({});
      setHasMore({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!isLoadMore) {
        const cached = loadFromCache(searchQuery);
        if (cached) {
          setResults(cached);
          setLoading(false);
          return;
        }
      }

      // Önceki isteği iptal et
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Paralel aramalar
      const [coins, news, users] = await Promise.all([
        searchCoins(searchQuery, isLoadMore),
        searchNews(searchQuery, isLoadMore),
        searchUsers(searchQuery, isLoadMore)
      ]);

      const newResults = {
        coins: coins.items || [],
        news: news.items || [],
        users: users.items || []
      };

      const newHasMore = {
        coins: coins.hasMore || false,
        news: news.hasMore || false,
        users: users.hasMore || false
      };

      setResults(prev => isLoadMore ? {
        coins: [...prev.coins, ...newResults.coins],
        news: [...prev.news, ...newResults.news],
        users: [...prev.users, ...newResults.users]
      } : newResults);

      setHasMore(newHasMore);
      
      if (!isLoadMore) {
        saveToCache(searchQuery, newResults);
        saveRecentSearch(searchQuery);
      }

      lastSearchRef.current = Date.now();

    } catch (err) {
      console.error('Arama hatası:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    loadFromCache,
    saveToCache,
    saveRecentSearch,
    searchCoins,
    searchNews,
    searchUsers
  ]);

  // Debounced arama
  const debouncedSearch = useCallback((searchQuery) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults({});
      setHasMore({});
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, DEBOUNCE_DELAY);
  }, [performSearch]);

  // Query güncelleme
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
    setPage(1);
    lastDocsRef.current = {};
    debouncedSearch(newQuery);
  }, [debouncedSearch]);

  // Daha fazla yükle
  const loadMore = useCallback(() => {
    if (!loading && Object.values(hasMore).some(Boolean)) {
      setPage(prev => prev + 1);
      performSearch(query, true);
    }
  }, [loading, hasMore, query, performSearch]);

  // Son aramaları yükle
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized stats
  const stats = useMemo(() => ({
    totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    resultCounts: Object.fromEntries(
      Object.entries(results).map(([key, arr]) => [key, arr.length])
    ),
    lastSearch: lastSearchRef.current,
    recentSearchCount: recentSearches.length
  }), [results, recentSearches]);

  return {
    query,
    results,
    recentSearches,
    stats,
    loading,
    error,
    hasMore,
    updateQuery,
    loadMore,
    clearRecentSearches: () => {
      setRecentSearches([]);
      localStorage.removeItem(`recent_searches_${userId}`);
    },
    lastSearch: lastSearchRef.current
  };
}; 