import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMarketData } from './useMarketData';
import { useNotifications } from './useNotifications';

const COLLECTION_NAME = 'alerts';
const CACHE_KEY = 'alerts_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 saat

const ALERT_TYPES = {
  PRICE_ABOVE: 'price_above',
  PRICE_BELOW: 'price_below',
  PRICE_CHANGE: 'price_change',
  VOLUME_CHANGE: 'volume_change',
  MARKET_CAP_CHANGE: 'market_cap_change',
  TREND_REVERSAL: 'trend_reversal',
  RSI: 'rsi',
  MACD: 'macd'
};

const ALERT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const ALERT_FREQUENCIES = {
  ONCE: 'once',
  RECURRING: 'recurring',
  PERSISTENT: 'persistent'
};

export const useAlerts = (userId, options = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const checkTimeoutRef = useRef(null);
  const alertHistoryRef = useRef(new Map());

  const { marketData } = useMarketData();
  const { addNotification } = useNotifications(userId);

  const {
    enableCache = true,
    autoCheck = true,
    checkInterval = 10000, // 10 saniye
    maxAlertsPerUser = 100,
    maxActiveAlerts = 20,
    enableSound = true,
    enableVibration = true,
    defaultPriority = ALERT_PRIORITIES.MEDIUM,
    defaultFrequency = ALERT_FREQUENCIES.ONCE
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

  // Alert durumu kontrolü
  const checkAlertCondition = useCallback((alert, marketData) => {
    const coin = marketData[alert.coinId];
    if (!coin) return false;

    const {
      type,
      value,
      duration = 0,
      percentage = false,
      operator = 'gte'
    } = alert.condition;

    const currentValue = (() => {
      switch (type) {
        case ALERT_TYPES.PRICE_ABOVE:
        case ALERT_TYPES.PRICE_BELOW:
          return coin.current_price;
        
        case ALERT_TYPES.PRICE_CHANGE:
          return percentage 
            ? coin.price_change_percentage_24h 
            : coin.price_change_24h;
        
        case ALERT_TYPES.VOLUME_CHANGE:
          return percentage
            ? coin.volume_change_percentage_24h
            : coin.volume_change_24h;
        
        case ALERT_TYPES.MARKET_CAP_CHANGE:
          return percentage
            ? coin.market_cap_change_percentage_24h
            : coin.market_cap_change_24h;
        
        case ALERT_TYPES.RSI:
          return coin.rsi;
        
        case ALERT_TYPES.MACD:
          return coin.macd;
        
        default:
          return null;
      }
    })();

    if (currentValue === null) return false;

    switch (operator) {
      case 'gt':
        return currentValue > value;
      case 'gte':
        return currentValue >= value;
      case 'lt':
        return currentValue < value;
      case 'lte':
        return currentValue <= value;
      case 'eq':
        return Math.abs(currentValue - value) < 0.000001;
      default:
        return false;
    }
  }, []);

  // Alert tetiklenme işlemi
  const triggerAlert = useCallback(async (alert) => {
    try {
      // Bildirim oluştur
      await addNotification({
        type: 'alert',
        title: alert.name,
        message: alert.message || `${alert.coinId} için alert tetiklendi`,
        priority: alert.priority,
        data: {
          alertId: alert.id,
          coinId: alert.coinId,
          condition: alert.condition
        }
      });

      // Alert geçmişi güncelle
      alertHistoryRef.current.set(alert.id, {
        timestamp: Date.now(),
        value: marketData[alert.coinId]?.current_price
      });

      // Alert durumunu güncelle
      if (alert.frequency === ALERT_FREQUENCIES.ONCE) {
        await updateDoc(doc(db, COLLECTION_NAME, alert.id), {
          status: 'triggered',
          triggeredAt: new Date(),
          active: false
        });
      } else {
        await updateDoc(doc(db, COLLECTION_NAME, alert.id), {
          lastTriggered: new Date()
        });
      }

      // Ses ve titreşim
      if (enableSound) {
        new Audio('/alert-sound.mp3').play();
      }
      if (enableVibration && navigator.vibrate) {
        navigator.vibrate(200);
      }

    } catch (err) {
      console.error('Alert tetikleme hatası:', err);
      setError(err.message);
    }
  }, [addNotification, marketData, enableSound, enableVibration]);

  // Alertleri getir
  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setAlerts(cached);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const alertsData = [];
        snapshot.forEach(doc => {
          alertsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setAlerts(alertsData);
        setActiveAlerts(alertsData.filter(a => a.active));
        saveToCache(alertsData);
        lastFetchRef.current = Date.now();
        setIsDirty(false);
        if (!silent) setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

    } catch (err) {
      console.error('Alert getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setAlerts(cached);
      }
    }
  }, [userId, loadFromCache, saveToCache]);

  // Alert oluştur
  const createAlert = useCallback(async (alertData) => {
    try {
      if (alerts.length >= maxAlertsPerUser) {
        throw new Error(`Maksimum alert sayısına ulaşıldı (${maxAlertsPerUser})`);
      }

      if (activeAlerts.length >= maxActiveAlerts && alertData.active) {
        throw new Error(`Maksimum aktif alert sayısına ulaşıldı (${maxActiveAlerts})`);
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...alertData,
        userId,
        priority: alertData.priority || defaultPriority,
        frequency: alertData.frequency || defaultFrequency,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setIsDirty(true);
      return docRef.id;

    } catch (err) {
      console.error('Alert oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, alerts.length, activeAlerts.length, maxAlertsPerUser, maxActiveAlerts, defaultPriority, defaultFrequency]);

  // Alert güncelle
  const updateAlert = useCallback(async (alertId, updates) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, alertId), {
        ...updates,
        updatedAt: new Date()
      });

      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Alert güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Alert sil
  const deleteAlert = useCallback(async (alertId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, alertId));
      alertHistoryRef.current.delete(alertId);
      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Alert silme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Otomatik kontrol
  useEffect(() => {
    if (!autoCheck || !marketData) return;

    checkTimeoutRef.current = setInterval(() => {
      activeAlerts.forEach(alert => {
        if (checkAlertCondition(alert, marketData)) {
          triggerAlert(alert);
        }
      });
    }, checkInterval);

    return () => {
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, [autoCheck, checkInterval, activeAlerts, marketData, checkAlertCondition, triggerAlert]);

  // İlk yükleme
  useEffect(() => {
    fetchAlerts();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, [fetchAlerts]);

  // Memoized değerler
  const stats = useMemo(() => ({
    total: alerts.length,
    active: activeAlerts.length,
    triggered: alerts.filter(a => a.status === 'triggered').length,
    byType: Object.fromEntries(
      Object.values(ALERT_TYPES).map(type => [
        type,
        alerts.filter(a => a.condition.type === type).length
      ])
    ),
    byPriority: Object.fromEntries(
      Object.values(ALERT_PRIORITIES).map(priority => [
        priority,
        alerts.filter(a => a.priority === priority).length
      ])
    ),
    history: Array.from(alertHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data,
      alert: alerts.find(a => a.id === id)
    })),
    lastUpdate: lastFetchRef.current
  }), [alerts, activeAlerts]);

  return {
    alerts,
    activeAlerts,
    stats,
    loading,
    error,
    isDirty,
    createAlert,
    updateAlert,
    deleteAlert,
    checkCondition: checkAlertCondition,
    refresh: fetchAlerts,
    lastFetch: lastFetchRef.current
  };
}; 