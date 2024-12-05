import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'analytics';
const CACHE_KEY = 'analytics_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 saat

const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  TRADE: 'trade',
  SEARCH: 'search',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  CUSTOM: 'custom'
};

const METRICS = {
  VIEWS: 'views',
  CLICKS: 'clicks',
  DURATION: 'duration',
  ERRORS: 'errors',
  TRADES: 'trades',
  VOLUME: 'volume'
};

const TIME_RANGES = {
  HOUR: '1h',
  DAY: '1d',
  WEEK: '1w',
  MONTH: '1m',
  YEAR: '1y'
};

export const useAnalytics = (userId, options = {}) => {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const sessionRef = useRef(null);
  const lastEventRef = useRef(null);
  const batchQueueRef = useRef([]);
  const metricsHistoryRef = useRef(new Map());

  const { settings } = useSettings();

  const {
    enableTracking = true,
    autoFlush = true,
    flushInterval = 30000, // 30 saniye
    batchSize = 10,
    samplingRate = 1,
    anonymizeIp = true,
    trackPerformance = true,
    trackErrors = true
  } = options;

  // Session yönetimi
  const initSession = useCallback(() => {
    if (!enableTracking) return null;

    const session = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      duration: 0,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };

    sessionRef.current = session;
    return session;
  }, [enableTracking]);

  // Event oluştur
  const trackEvent = useCallback(async (type, data = {}) => {
    if (!enableTracking || Math.random() > samplingRate) return;

    try {
      const event = {
        type,
        userId,
        sessionId: sessionRef.current?.id,
        timestamp: Date.now(),
        data: {
          ...data,
          url: window.location.href,
          title: document.title
        }
      };

      if (anonymizeIp) {
        const ip = await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip.replace(/\.\d+$/, '.0'));
        event.data.ip = ip;
      }

      batchQueueRef.current.push(event);
      lastEventRef.current = event;

      // Session güncelle
      if (sessionRef.current) {
        sessionRef.current.lastActivity = Date.now();
        sessionRef.current.events++;
        if (type === EVENT_TYPES.PAGE_VIEW) {
          sessionRef.current.pageViews++;
        }
      }

      // Batch kontrolü
      if (batchQueueRef.current.length >= batchSize) {
        await flushEvents();
      }

      return event;

    } catch (err) {
      console.error('Event tracking hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [enableTracking, userId, samplingRate, anonymizeIp, batchSize]);

  // Performans metrikleri
  const trackPerformanceMetric = useCallback((metric) => {
    if (!trackPerformance) return;

    const { name, value, rating = 'neutral' } = metric;
    
    trackEvent(EVENT_TYPES.PERFORMANCE, {
      metric: name,
      value,
      rating,
      timestamp: performance.now()
    });
  }, [trackPerformance, trackEvent]);

  // Hata takibi
  const trackError = useCallback((error) => {
    if (!trackErrors) return;

    trackEvent(EVENT_TYPES.ERROR, {
      message: error.message,
      stack: error.stack,
      type: error.name,
      timestamp: Date.now()
    });
  }, [trackErrors, trackEvent]);

  // Metrikleri hesapla
  const calculateMetrics = useCallback((timeRange = TIME_RANGES.DAY) => {
    const now = Date.now();
    const rangeStart = now - getTimeRangeMs(timeRange);
    
    const rangeEvents = events.filter(e => e.timestamp >= rangeStart);
    
    const metrics = {
      [METRICS.VIEWS]: rangeEvents.filter(e => e.type === EVENT_TYPES.PAGE_VIEW).length,
      [METRICS.CLICKS]: rangeEvents.filter(e => e.type === EVENT_TYPES.CLICK).length,
      [METRICS.DURATION]: sessionRef.current ? now - sessionRef.current.startTime : 0,
      [METRICS.ERRORS]: rangeEvents.filter(e => e.type === EVENT_TYPES.ERROR).length,
      [METRICS.TRADES]: rangeEvents.filter(e => e.type === EVENT_TYPES.TRADE).length,
      [METRICS.VOLUME]: rangeEvents
        .filter(e => e.type === EVENT_TYPES.TRADE)
        .reduce((sum, e) => sum + (e.data.volume || 0), 0)
    };

    setMetrics(metrics);
    
    // Metrik geçmişini güncelle
    if (!metricsHistoryRef.current.has(timeRange)) {
      metricsHistoryRef.current.set(timeRange, []);
    }
    metricsHistoryRef.current.get(timeRange).push({
      timestamp: now,
      metrics
    });

    return metrics;
  }, [events]);

  // Event'leri gönder
  const flushEvents = useCallback(async () => {
    if (batchQueueRef.current.length === 0) return;

    try {
      const batch = batchQueueRef.current;
      batchQueueRef.current = [];

      await addDoc(collection(db, COLLECTION_NAME), {
        userId,
        sessionId: sessionRef.current?.id,
        events: batch,
        createdAt: new Date()
      });

      setEvents(prev => [...prev, ...batch]);

    } catch (err) {
      console.error('Event flush hatası:', err);
      setError(err.message);
      // Başarısız event'leri geri queue'ya ekle
      batchQueueRef.current = [...batchQueueRef.current, ...batch];
    }
  }, [userId]);

  // Otomatik flush
  useEffect(() => {
    if (!autoFlush) return;

    const flushInterval = setInterval(() => {
      if (batchQueueRef.current.length > 0) {
        flushEvents();
      }
    }, flushInterval);

    return () => {
      clearInterval(flushInterval);
      flushEvents(); // Cleanup'ta kalan event'leri gönder
    };
  }, [autoFlush, flushInterval, flushEvents]);

  // Global error handling
  useEffect(() => {
    if (!trackErrors) return;

    const handleError = (error) => {
      trackError(error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [trackErrors, trackError]);

  // Session başlat
  useEffect(() => {
    initSession();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.duration = Date.now() - sessionRef.current.startTime;
        // Session verilerini kaydet
        trackEvent('session_end', {
          duration: sessionRef.current.duration,
          pageViews: sessionRef.current.pageViews,
          events: sessionRef.current.events
        });
      }
    };
  }, [initSession, trackEvent]);

  // Memoized değerler
  const analyticsStats = useMemo(() => ({
    session: sessionRef.current,
    lastEvent: lastEventRef.current,
    queueSize: batchQueueRef.current.length,
    metrics,
    history: Array.from(metricsHistoryRef.current.entries()).map(([range, data]) => ({
      range,
      data: data.slice(-100) // Son 100 veri
    }))
  }), [metrics]);

  return {
    trackEvent,
    trackPerformanceMetric,
    trackError,
    calculateMetrics,
    flushEvents,
    events,
    metrics,
    stats: analyticsStats,
    loading,
    error
  };
}; 