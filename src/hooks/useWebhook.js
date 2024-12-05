import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'webhooks';
const CACHE_KEY = 'webhook_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

const WEBHOOK_TYPES = {
  PRICE_ALERT: 'price_alert',
  TRADE: 'trade',
  ORDER: 'order',
  PORTFOLIO: 'portfolio',
  SYSTEM: 'system',
  CUSTOM: 'custom'
};

const TRIGGER_TYPES = {
  ABOVE: 'above',
  BELOW: 'below',
  CROSSES: 'crosses',
  EQUALS: 'equals',
  PERCENT_CHANGE: 'percent_change',
  TIME: 'time',
  EVENT: 'event'
};

const DELIVERY_METHODS = {
  HTTP: 'http',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
  EMAIL: 'email',
  SMS: 'sms'
};

const STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  TRIGGERED: 'triggered',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

export const useWebhook = (userId, options = {}) => {
  const [webhooks, setWebhooks] = useState([]);
  const [activeHooks, setActiveHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});
  
  const webhookQueueRef = useRef([]);
  const retryAttemptsRef = useRef(new Map());
  const lastTriggerRef = useRef(new Map());
  const webhookHistoryRef = useRef(new Map());

  const { settings } = useSettings();

  const {
    enableCache = true,
    maxWebhooks = 50,
    maxRetries = 3,
    retryDelay = 5000,
    batchSize = 10,
    validateUrls = true,
    logHistory = true,
    defaultMethod = DELIVERY_METHODS.HTTP,
    defaultTimeout = 10000
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

  // URL doğrulama
  const validateUrl = useCallback(async (url) => {
    if (!validateUrls) return true;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: defaultTimeout
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }, [validateUrls, defaultTimeout]);

  // Webhook oluştur
  const createWebhook = useCallback(async (webhookData) => {
    try {
      const {
        type = WEBHOOK_TYPES.CUSTOM,
        trigger,
        triggerType,
        deliveryMethod = defaultMethod,
        url,
        payload = {},
        headers = {},
        conditions = [],
        expiresAt = null
      } = webhookData;

      // Validasyonlar
      if (webhooks.length >= maxWebhooks) {
        throw new Error('Maksimum webhook limitine ulaşıldı');
      }

      if (deliveryMethod === DELIVERY_METHODS.HTTP && !(await validateUrl(url))) {
        throw new Error('Geçersiz webhook URL');
      }

      const webhook = {
        userId,
        type,
        trigger,
        triggerType,
        deliveryMethod,
        url,
        payload,
        headers,
        conditions,
        status: STATUS.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt,
        lastTrigger: null,
        triggerCount: 0,
        failureCount: 0
      };

      const webhookDoc = await addDoc(collection(db, COLLECTION_NAME), webhook);
      
      // History kaydet
      if (logHistory) {
        webhookHistoryRef.current.set(webhookDoc.id, {
          ...webhook,
          history: [{
            type: 'create',
            timestamp: Date.now(),
            data: webhook
          }]
        });
      }

      return { ...webhook, id: webhookDoc.id };

    } catch (err) {
      console.error('Webhook oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [webhooks, maxWebhooks, validateUrl, defaultMethod, userId, logHistory]);

  // Webhook tetikle
  const triggerWebhook = useCallback(async (webhookId, data = {}) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) {
        throw new Error('Webhook bulunamadı');
      }

      // Rate limit kontrolü
      const lastTrigger = lastTriggerRef.current.get(webhookId);
      if (lastTrigger && Date.now() - lastTrigger < retryDelay) {
        throw new Error('Rate limit - lütfen bekleyin');
      }

      // Payload hazırla
      const payload = {
        ...webhook.payload,
        ...data,
        timestamp: Date.now(),
        webhookId
      };

      // Webhook gönder
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(payload),
        timeout: defaultTimeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Başarılı trigger
      await updateDoc(doc(db, COLLECTION_NAME, webhookId), {
        lastTrigger: new Date(),
        triggerCount: webhook.triggerCount + 1,
        status: STATUS.TRIGGERED,
        updatedAt: new Date()
      });

      lastTriggerRef.current.set(webhookId, Date.now());
      retryAttemptsRef.current.delete(webhookId);

      // History güncelle
      if (logHistory) {
        const hookHistory = webhookHistoryRef.current.get(webhookId);
        if (hookHistory) {
          hookHistory.history.push({
            type: 'trigger',
            timestamp: Date.now(),
            data: {
              payload,
              response: await response.json()
            }
          });
        }
      }

      return response;

    } catch (err) {
      console.error('Webhook tetikleme hatası:', err);
      
      const retryCount = (retryAttemptsRef.current.get(webhookId) || 0) + 1;
      retryAttemptsRef.current.set(webhookId, retryCount);

      if (retryCount <= maxRetries) {
        // Yeniden deneme kuyruğuna ekle
        webhookQueueRef.current.push({
          webhookId,
          data,
          retryCount,
          timestamp: Date.now() + retryDelay
        });
      } else {
        // Maksimum deneme sayısına ulaşıldı
        await updateDoc(doc(db, COLLECTION_NAME, webhookId), {
          status: STATUS.FAILED,
          failureCount: webhook.failureCount + 1,
          lastError: err.message,
          updatedAt: new Date()
        });
      }

      setError(err.message);
      throw err;
    }
  }, [webhooks, retryDelay, maxRetries, defaultTimeout, logHistory]);

  // Webhook test
  const testWebhook = useCallback(async (webhookId) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) {
        throw new Error('Webhook bulunamadı');
      }

      const testPayload = {
        test: true,
        timestamp: Date.now(),
        webhookId
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload),
        timeout: defaultTimeout
      });

      const result = {
        success: response.ok,
        status: response.status,
        timestamp: Date.now()
      };

      setTestResults(prev => ({
        ...prev,
        [webhookId]: result
      }));

      return result;

    } catch (err) {
      console.error('Webhook test hatası:', err);
      setError(err.message);
      
      const result = {
        success: false,
        error: err.message,
        timestamp: Date.now()
      };

      setTestResults(prev => ({
        ...prev,
        [webhookId]: result
      }));

      throw err;
    }
  }, [webhooks, defaultTimeout]);

  // Retry queue işle
  useEffect(() => {
    const processQueue = async () => {
      const now = Date.now();
      const queue = webhookQueueRef.current;
      
      // Zamanı gelen webhook'ları işle
      const toProcess = queue.filter(item => item.timestamp <= now);
      webhookQueueRef.current = queue.filter(item => item.timestamp > now);

      for (const item of toProcess) {
        try {
          await triggerWebhook(item.webhookId, item.data);
        } catch (err) {
          console.error('Retry işleme hatası:', err);
        }
      }
    };

    const interval = setInterval(processQueue, 1000);
    return () => clearInterval(interval);
  }, [triggerWebhook]);

  // Webhook'ları getir
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const webhookData = [];
      snapshot.forEach(doc => {
        webhookData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setWebhooks(webhookData);
      setActiveHooks(webhookData.filter(w => w.status === STATUS.ACTIVE));
      setLoading(false);
      
      saveToCache(webhookData);
    });

    return () => unsubscribe();
  }, [userId, saveToCache]);

  // Memoized değerler
  const webhookStats = useMemo(() => ({
    total: webhooks.length,
    active: activeHooks.length,
    byType: Object.fromEntries(
      Object.values(WEBHOOK_TYPES).map(type => [
        type,
        webhooks.filter(w => w.type === type).length
      ])
    ),
    byStatus: Object.fromEntries(
      Object.values(STATUS).map(status => [
        status,
        webhooks.filter(w => w.status === status).length
      ])
    ),
    byMethod: Object.fromEntries(
      Object.values(DELIVERY_METHODS).map(method => [
        method,
        webhooks.filter(w => w.deliveryMethod === method).length
      ])
    ),
    testResults,
    history: Array.from(webhookHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data
    }))
  }), [webhooks, activeHooks, testResults]);

  return {
    webhooks,
    activeHooks,
    stats: webhookStats,
    loading,
    error,
    createWebhook,
    triggerWebhook,
    testWebhook,
    testResults
  };
}; 