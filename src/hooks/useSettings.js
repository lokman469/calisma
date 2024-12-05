import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'settings';
const CACHE_KEY = 'settings_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

const SETTING_CATEGORIES = {
  DISPLAY: 'display',
  TRADING: 'trading',
  NOTIFICATIONS: 'notifications',
  SECURITY: 'security',
  PRIVACY: 'privacy',
  LANGUAGE: 'language',
  ADVANCED: 'advanced'
};

const DEFAULT_SETTINGS = {
  display: {
    theme: {
      mode: 'system',
      scheme: 'default',
      fontSize: 'medium',
      density: 'comfortable'
    },
    charts: {
      defaultTimeframe: '1d',
      showVolume: true,
      showGrid: true,
      showLegend: true,
      animations: true
    },
    layout: {
      sidebarPosition: 'left',
      compactMode: false,
      showTicker: true
    }
  },
  trading: {
    defaultExchange: 'binance',
    defaultPair: 'USDT',
    confirmations: true,
    slippage: 0.5,
    autoRefresh: true,
    refreshInterval: 10000
  },
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    desktop: true,
    mobile: true,
    email: true,
    types: {
      price: true,
      trade: true,
      news: true,
      system: true
    }
  },
  security: {
    twoFactor: false,
    biometric: false,
    autoLock: true,
    lockTimeout: 300000,
    ipWhitelist: [],
    deviceWhitelist: []
  },
  privacy: {
    shareData: false,
    trackAnalytics: true,
    saveLogs: true,
    cookieConsent: false
  },
  language: {
    primary: 'tr',
    fallback: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: 'tr-TR'
  },
  advanced: {
    debug: false,
    experimentalFeatures: false,
    apiEndpoint: 'production',
    wsEndpoint: 'production',
    cacheStrategy: 'network-first'
  }
};

export const useSettings = (userId, options = {}) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const lastFetchRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const settingsHistoryRef = useRef([]);

  const {
    enableCache = true,
    autoSync = true,
    syncInterval = 60000, // 1 dakika
    maxHistory = 50,
    validateSettings = true,
    mergeDefaults = true
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

  // Ayarları doğrula
  const validateSettingsData = useCallback((data) => {
    if (!validateSettings) return true;

    // Her kategori için şema kontrolü
    const schema = {
      display: {
        theme: ['mode', 'scheme', 'fontSize', 'density'],
        charts: ['defaultTimeframe', 'showVolume', 'showGrid', 'showLegend', 'animations'],
        layout: ['sidebarPosition', 'compactMode', 'showTicker']
      },
      trading: ['defaultExchange', 'defaultPair', 'confirmations', 'slippage', 'autoRefresh', 'refreshInterval'],
      notifications: {
        _self: ['enabled', 'sound', 'vibration', 'desktop', 'mobile', 'email'],
        types: ['price', 'trade', 'news', 'system']
      },
      security: ['twoFactor', 'biometric', 'autoLock', 'lockTimeout', 'ipWhitelist', 'deviceWhitelist'],
      privacy: ['shareData', 'trackAnalytics', 'saveLogs', 'cookieConsent'],
      language: ['primary', 'fallback', 'dateFormat', 'timeFormat', 'numberFormat'],
      advanced: ['debug', 'experimentalFeatures', 'apiEndpoint', 'wsEndpoint', 'cacheStrategy']
    };

    const validateObject = (obj, schemaObj) => {
      for (const [key, value] of Object.entries(schemaObj)) {
        if (Array.isArray(value)) {
          // Basit alan kontrolü
          if (!obj[key] || typeof obj[key] !== 'object') {
            return false;
          }
          for (const field of value) {
            if (!(field in obj[key])) {
              return false;
            }
          }
        } else if (typeof value === 'object') {
          // İç içe obje kontrolü
          if (!obj[key] || typeof obj[key] !== 'object') {
            return false;
          }
          if (value._self) {
            for (const field of value._self) {
              if (!(field in obj[key])) {
                return false;
              }
            }
          }
          const nestedSchema = { ...value };
          delete nestedSchema._self;
          if (!validateObject(obj[key], nestedSchema)) {
            return false;
          }
        }
      }
      return true;
    };

    return validateObject(data, schema);
  }, [validateSettings]);

  // Ayarları getir
  const fetchSettings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setSettings(cached);
          setLoading(false);
          return;
        }
      }

      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);

      let settingsData;
      if (docSnap.exists()) {
        settingsData = docSnap.data();
      } else {
        // Varsayılan ayarları oluştur
        settingsData = DEFAULT_SETTINGS;
        await setDoc(docRef, settingsData);
      }

      // Varsayılan ayarlarla birleştir
      if (mergeDefaults) {
        settingsData = {
          ...DEFAULT_SETTINGS,
          ...settingsData
        };
      }

      // Doğrulama
      if (!validateSettingsData(settingsData)) {
        throw new Error('Geçersiz ayar formatı');
      }

      setSettings(settingsData);
      saveToCache(settingsData);
      lastFetchRef.current = Date.now();
      setIsDirty(false);

      if (!silent) setLoading(false);

    } catch (err) {
      console.error('Ayarları getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setSettings(cached);
      }
    }
  }, [userId, loadFromCache, saveToCache, validateSettingsData, mergeDefaults]);

  // Ayarları güncelle
  const updateSettings = useCallback(async (updates, category = null) => {
    try {
      let newSettings;
      if (category) {
        newSettings = {
          ...settings,
          [category]: {
            ...settings[category],
            ...updates
          }
        };
      } else {
        newSettings = {
          ...settings,
          ...updates
        };
      }

      // Doğrulama
      if (!validateSettingsData(newSettings)) {
        throw new Error('Geçersiz ayar formatı');
      }

      // Geçmişe ekle
      settingsHistoryRef.current.push({
        timestamp: Date.now(),
        settings: { ...settings }
      });
      if (settingsHistoryRef.current.length > maxHistory) {
        settingsHistoryRef.current.shift();
      }

      // Güncelleme
      await updateDoc(doc(db, COLLECTION_NAME, userId), newSettings);
      
      setSettings(newSettings);
      saveToCache(newSettings);
      setIsDirty(true);

      return true;

    } catch (err) {
      console.error('Ayar güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, settings, validateSettingsData, maxHistory, saveToCache]);

  // Ayarları geri al
  const revertSettings = useCallback(async (timestamp = null) => {
    try {
      let targetSettings;
      
      if (timestamp) {
        // Belirli bir zamana geri dön
        const historyEntry = settingsHistoryRef.current.find(
          entry => entry.timestamp === timestamp
        );
        if (!historyEntry) {
          throw new Error('Geçmiş ayar bulunamadı');
        }
        targetSettings = historyEntry.settings;
      } else {
        // Son değişikliği geri al
        const lastEntry = settingsHistoryRef.current.pop();
        if (!lastEntry) {
          throw new Error('Geri alınacak değişiklik yok');
        }
        targetSettings = lastEntry.settings;
      }

      await updateDoc(doc(db, COLLECTION_NAME, userId), targetSettings);
      
      setSettings(targetSettings);
      saveToCache(targetSettings);
      setIsDirty(true);

      return true;

    } catch (err) {
      console.error('Ayarları geri alma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, saveToCache]);

  // Otomatik senkronizasyon
  useEffect(() => {
    if (!autoSync) return;

    const syncTimeout = setInterval(() => {
      if (isDirty) {
        fetchSettings(true);
      }
    }, syncInterval);

    return () => {
      clearInterval(syncTimeout);
    };
  }, [autoSync, syncInterval, isDirty, fetchSettings]);

  // İlk yükleme
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Memoized değerler
  const settingsState = useMemo(() => ({
    ...settings,
    history: settingsHistoryRef.current.map(entry => ({
      timestamp: entry.timestamp,
      changes: Object.entries(entry.settings).reduce((acc, [key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(settings?.[key])) {
          acc[key] = value;
        }
        return acc;
      }, {})
    })),
    lastUpdate: lastFetchRef.current
  }), [settings]);

  return {
    settings: settingsState,
    loading,
    error,
    isDirty,
    updateSettings,
    revertSettings,
    refresh: fetchSettings,
    lastFetch: lastFetchRef.current
  };
}; 