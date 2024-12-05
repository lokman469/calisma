import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useExchange } from './useExchange';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'wallets';
const CACHE_KEY = 'wallet_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika

const WALLET_TYPES = {
  EXCHANGE: 'exchange',
  HARDWARE: 'hardware',
  SOFTWARE: 'software',
  PAPER: 'paper',
  WATCH: 'watch'
};

const WALLET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  LOCKED: 'locked'
};

const SECURITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

const SUPPORTED_NETWORKS = {
  ETHEREUM: 'ethereum',
  BITCOIN: 'bitcoin',
  BINANCE: 'binance',
  POLYGON: 'polygon',
  SOLANA: 'solana'
};

export const useWallet = (userId, options = {}) => {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const balanceHistoryRef = useRef(new Map());

  const { exchangeData } = useExchange();
  const { settings } = useSettings(userId);

  const {
    enableCache = true,
    autoUpdate = true,
    updateInterval = 60000, // 1 dakika
    maxWallets = 10,
    defaultType = WALLET_TYPES.EXCHANGE,
    defaultNetwork = SUPPORTED_NETWORKS.ETHEREUM,
    securityLevel = SECURITY_LEVELS.HIGH,
    enableBackup = true,
    enableExport = true
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

  // Bakiye hesaplama
  const calculateBalances = useCallback((wallet) => {
    const balances = {};
    
    wallet.assets.forEach(asset => {
      const { coinId, amount, network } = asset;
      const price = exchangeData?.prices?.[coinId]?.current_price || 0;
      
      balances[coinId] = {
        amount,
        network,
        value: amount * price,
        price,
        lastUpdate: new Date()
      };
    });

    return balances;
  }, [exchangeData]);

  // Cüzdan doğrulama
  const validateWallet = useCallback((wallet) => {
    // Temel doğrulamalar
    if (!wallet.name || !wallet.type || !wallet.network) {
      throw new Error('Geçersiz cüzdan bilgileri');
    }

    // Adres formatı kontrolü
    const addressRegex = {
      [SUPPORTED_NETWORKS.ETHEREUM]: /^0x[a-fA-F0-9]{40}$/,
      [SUPPORTED_NETWORKS.BITCOIN]: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      [SUPPORTED_NETWORKS.BINANCE]: /^bnb[0-9a-z]{39}$/,
      [SUPPORTED_NETWORKS.POLYGON]: /^0x[a-fA-F0-9]{40}$/,
      [SUPPORTED_NETWORKS.SOLANA]: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    };

    if (!addressRegex[wallet.network]?.test(wallet.address)) {
      throw new Error(`Geçersiz ${wallet.network} adresi`);
    }

    // Güvenlik seviyesi kontrolü
    if (wallet.securityLevel < securityLevel) {
      throw new Error('Yetersiz güvenlik seviyesi');
    }

    return true;
  }, [securityLevel]);

  // Cüzdanları getir
  const fetchWallets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setWallets(cached);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', '==', WALLET_STATUS.ACTIVE),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const walletsData = [];
        snapshot.forEach(doc => {
          const wallet = {
            id: doc.id,
            ...doc.data()
          };
          
          // Bakiye hesapla
          const balances = calculateBalances(wallet);
          setBalances(prev => ({
            ...prev,
            [wallet.id]: balances
          }));

          // Bakiye geçmişi güncelle
          balanceHistoryRef.current.set(wallet.id, [
            {
              timestamp: Date.now(),
              balances
            },
            ...(balanceHistoryRef.current.get(wallet.id) || []).slice(0, 99)
          ]);

          walletsData.push(wallet);
        });

        setWallets(walletsData);
        saveToCache(walletsData);
        lastFetchRef.current = Date.now();
        setIsDirty(false);
        if (!silent) setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

    } catch (err) {
      console.error('Cüzdan getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setWallets(cached);
      }
    }
  }, [userId, calculateBalances, loadFromCache, saveToCache]);

  // Cüzdan oluştur
  const createWallet = useCallback(async (walletData) => {
    try {
      if (wallets.length >= maxWallets) {
        throw new Error(`Maksimum cüzdan sayısına ulaşıldı (${maxWallets})`);
      }

      // Doğrulama
      validateWallet(walletData);

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...walletData,
        userId,
        type: walletData.type || defaultType,
        network: walletData.network || defaultNetwork,
        status: WALLET_STATUS.ACTIVE,
        securityLevel: walletData.securityLevel || securityLevel,
        assets: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setIsDirty(true);
      return docRef.id;

    } catch (err) {
      console.error('Cüzdan oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, wallets.length, maxWallets, defaultType, defaultNetwork, securityLevel, validateWallet]);

  // Cüzdan güncelle
  const updateWallet = useCallback(async (walletId, updates) => {
    try {
      // Doğrulama
      if (updates.address || updates.network) {
        validateWallet({ ...wallets.find(w => w.id === walletId), ...updates });
      }

      await updateDoc(doc(db, COLLECTION_NAME, walletId), {
        ...updates,
        updatedAt: new Date()
      });

      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Cüzdan güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [wallets, validateWallet]);

  // Cüzdan sil
  const deleteWallet = useCallback(async (walletId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, walletId));
      balanceHistoryRef.current.delete(walletId);
      setIsDirty(true);
      return true;

    } catch (err) {
      console.error('Cüzdan silme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Cüzdan yedekle
  const backupWallet = useCallback(async (walletId) => {
    if (!enableBackup) return;

    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Cüzdan bulunamadı');

      const backupData = {
        wallet,
        balances: balances[walletId],
        history: balanceHistoryRef.current.get(walletId),
        timestamp: Date.now()
      };

      // Yedekleme işlemleri...
      
      return true;

    } catch (err) {
      console.error('Cüzdan yedekleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [wallets, balances, enableBackup]);

  // Cüzdan dışa aktar
  const exportWallet = useCallback(async (walletId, format = 'json') => {
    if (!enableExport) return;

    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Cüzdan bulunamadı');

      const exportData = {
        wallet,
        balances: balances[walletId],
        history: balanceHistoryRef.current.get(walletId),
        timestamp: Date.now()
      };

      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        case 'csv':
          // CSV formatına çevir...
          break;
        case 'pdf':
          // PDF oluştur...
          break;
        default:
          throw new Error('Desteklenmeyen format');
      }

    } catch (err) {
      console.error('Cüzdan dışa aktarma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [wallets, balances, enableExport]);

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoUpdate) return;

    updateTimeoutRef.current = setInterval(() => {
      fetchWallets(true);
    }, updateInterval);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchWallets]);

  // İlk yükleme
  useEffect(() => {
    fetchWallets();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [fetchWallets]);

  // Memoized değerler
  const stats = useMemo(() => ({
    total: wallets.length,
    byType: Object.fromEntries(
      Object.values(WALLET_TYPES).map(type => [
        type,
        wallets.filter(w => w.type === type).length
      ])
    ),
    byNetwork: Object.fromEntries(
      Object.values(SUPPORTED_NETWORKS).map(network => [
        network,
        wallets.filter(w => w.network === network).length
      ])
    ),
    totalBalance: Object.values(balances).reduce((total, walletBalances) => 
      total + Object.values(walletBalances).reduce((sum, { value }) => sum + value, 0)
    , 0),
    history: Array.from(balanceHistoryRef.current.entries()).map(([id, history]) => ({
      id,
      history,
      wallet: wallets.find(w => w.id === id)
    })),
    lastUpdate: lastFetchRef.current
  }), [wallets, balances]);

  return {
    wallets,
    activeWallet,
    balances,
    stats,
    loading,
    error,
    isDirty,
    setActiveWallet,
    createWallet,
    updateWallet,
    deleteWallet,
    backupWallet,
    exportWallet,
    refresh: fetchWallets,
    lastFetch: lastFetchRef.current
  };
}; 