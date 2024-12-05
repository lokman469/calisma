import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'news';
const CACHE_KEY = 'news_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

const NEWS_TYPES = {
  GENERAL: 'general',
  MARKET: 'market',
  TECHNICAL: 'technical',
  REGULATORY: 'regulatory',
  SOCIAL: 'social',
  PROJECT: 'project'
};

const NEWS_SOURCES = {
  COINDESK: 'coindesk',
  COINTELEGRAPH: 'cointelegraph',
  CRYPTONEWS: 'cryptonews',
  DECRYPT: 'decrypt',
  THEBLOCK: 'theblock'
};

const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
};

export const useNews = (userId, options = {}) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const lastFetchRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastDocRef = useRef(null);

  const { settings } = useSettings(userId);

  const {
    enableCache = true,
    autoRefresh = true,
    refreshInterval = 300000, // 5 dakika
    pageSize = 20,
    includedTypes = Object.values(NEWS_TYPES),
    includedSources = Object.values(NEWS_SOURCES),
    language = settings?.display?.language || 'tr',
    sentiment = true,
    summarize = true,
    translate = true
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${language}`);
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

  const saveToCache = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${language}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, language]);

  // Haberleri getir
  const fetchNews = useCallback(async (silent = false, reset = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Önceki isteği iptal et
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Cache kontrol
      if (reset && !silent) {
        const cached = loadFromCache();
        if (cached) {
          setNews(cached);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('type', 'in', includedTypes),
        where('source', 'in', includedSources),
        where('language', '==', language),
        orderBy('publishedAt', 'desc'),
        ...(lastDocRef.current && !reset ? [startAfter(lastDocRef.current)] : []),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const newsData = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Duygu analizi
        if (sentiment && !data.sentiment) {
          analyzeSentiment(doc.id, data.content);
        }

        // Özet
        if (summarize && !data.summary) {
          generateSummary(doc.id, data.content);
        }

        // Çeviri
        if (translate && data.language !== language) {
          translateContent(doc.id, data.content, language);
        }

        newsData.push({
          id: doc.id,
          ...data
        });
      });

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(newsData.length === pageSize);

      if (reset) {
        setNews(newsData);
        saveToCache(newsData);
      } else {
        setNews(prev => [...prev, ...newsData]);
      }

      lastFetchRef.current = Date.now();
      if (!silent) setLoading(false);

    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Haber getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      if (reset) {
        const cached = loadFromCache();
        if (cached) {
          setNews(cached);
        }
      }
    }
  }, [
    pageSize,
    includedTypes,
    includedSources,
    language,
    sentiment,
    summarize,
    translate,
    loadFromCache,
    saveToCache
  ]);

  // Duygu analizi
  const analyzeSentiment = useCallback(async (newsId, content) => {
    try {
      const response = await fetch('/api/analyze/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const { sentiment } = await response.json();
      
      await updateDoc(doc(db, COLLECTION_NAME, newsId), {
        sentiment,
        analyzedAt: new Date()
      });

    } catch (err) {
      console.error('Duygu analizi hatası:', err);
    }
  }, []);

  // Özet oluştur
  const generateSummary = useCallback(async (newsId, content) => {
    try {
      const response = await fetch('/api/analyze/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const { summary } = await response.json();
      
      await updateDoc(doc(db, COLLECTION_NAME, newsId), {
        summary,
        summarizedAt: new Date()
      });

    } catch (err) {
      console.error('Özet oluşturma hatası:', err);
    }
  }, []);

  // İçerik çeviri
  const translateContent = useCallback(async (newsId, content, targetLanguage) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content,
          targetLanguage 
        })
      });

      const { translatedContent } = await response.json();
      
      await updateDoc(doc(db, COLLECTION_NAME, newsId), {
        [`content_${targetLanguage}`]: translatedContent,
        translatedAt: new Date()
      });

    } catch (err) {
      console.error('Çeviri hatası:', err);
    }
  }, []);

  // Otomatik yenileme
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshTimeout = setInterval(() => {
      fetchNews(true, true);
    }, refreshInterval);

    return () => {
      clearInterval(refreshTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoRefresh, refreshInterval, fetchNews]);

  // İlk yükleme
  useEffect(() => {
    fetchNews(false, true);
  }, [fetchNews]);

  // Dil değişikliği
  useEffect(() => {
    setPage(1);
    lastDocRef.current = null;
    fetchNews(false, true);
  }, [language, fetchNews]);

  // Memoized değerler
  const stats = useMemo(() => ({
    total: news.length,
    byType: Object.fromEntries(
      Object.values(NEWS_TYPES).map(type => [
        type,
        news.filter(n => n.type === type).length
      ])
    ),
    bySource: Object.fromEntries(
      Object.values(NEWS_SOURCES).map(source => [
        source,
        news.filter(n => n.source === source).length
      ])
    ),
    bySentiment: sentiment ? Object.fromEntries(
      Object.values(SENTIMENT_TYPES).map(sentiment => [
        sentiment,
        news.filter(n => n.sentiment === sentiment).length
      ])
    ) : null,
    lastUpdate: lastFetchRef.current
  }), [news, sentiment]);

  return {
    news,
    stats,
    loading,
    error,
    hasMore,
    page,
    loadMore: () => {
      if (!loading && hasMore) {
        setPage(prev => prev + 1);
        fetchNews(false, false);
      }
    },
    refresh: () => fetchNews(false, true),
    lastFetch: lastFetchRef.current
  };
}; 