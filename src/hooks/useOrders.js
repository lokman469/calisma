import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useExchange } from './useExchange';
import { useWallet } from './useWallet';

const COLLECTION_NAME = 'orders';
const CACHE_KEY = 'orders_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_LIMIT: 'stop_limit',
  STOP_MARKET: 'stop_market',
  TRAILING_STOP: 'trailing_stop',
  OCO: 'oco'
};

const ORDER_SIDES = {
  BUY: 'buy',
  SELL: 'sell'
};

const ORDER_STATUS = {
  NEW: 'new',
  PENDING: 'pending',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

const TIME_IN_FORCE = {
  GTC: 'gtc', // Good Till Cancel
  IOC: 'ioc', // Immediate or Cancel
  FOK: 'fok', // Fill or Kill
  GTD: 'gtd'  // Good Till Date
};

export const useOrders = (userId, options = {}) => {
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const orderHistoryRef = useRef(new Map());

  const { exchangeData, createExchangeOrder, cancelExchangeOrder } = useExchange();
  const { updateAsset } = useWallet(userId);

  const {
    enableCache = true,
    autoUpdate = true,
    updateInterval = 10000, // 10 saniye
    maxOrders = 100,
    maxHistory = 1000,
    defaultType = ORDER_TYPES.LIMIT,
    defaultTimeInForce = TIME_IN_FORCE.GTC,
    validateBalance = true,
    trackHistory = true
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

  // Order validasyonu
  const validateOrder = useCallback((orderData) => {
    const {
      symbol,
      type = defaultType,
      side,
      quantity,
      price,
      stopPrice,
      timeInForce = defaultTimeInForce
    } = orderData;

    if (!symbol || !side || !quantity) {
      throw new Error('Geçersiz order parametreleri');
    }

    if (type !== ORDER_TYPES.MARKET && !price) {
      throw new Error('Limit orderlar için fiyat gerekli');
    }

    if ([ORDER_TYPES.STOP_LIMIT, ORDER_TYPES.STOP_MARKET].includes(type) && !stopPrice) {
      throw new Error('Stop orderlar için stop fiyatı gerekli');
    }

    if (validateBalance) {
      // Bakiye kontrolü
      const [baseAsset, quoteAsset] = symbol.split('/');
      const requiredAmount = side === ORDER_SIDES.BUY
        ? quantity * (price || exchangeData.prices[symbol])
        : quantity;

      if (!hasEnoughBalance(side === ORDER_SIDES.BUY ? quoteAsset : baseAsset, requiredAmount)) {
        throw new Error('Yetersiz bakiye');
      }
    }

    return true;
  }, [defaultType, defaultTimeInForce, validateBalance, exchangeData]);

  // Bakiye kontrolü
  const hasEnoughBalance = useCallback((asset, amount) => {
    if (!validateBalance) return true;
    
    const balance = exchangeData.balances[asset]?.free || 0;
    return balance >= amount;
  }, [validateBalance, exchangeData]);

  // Order oluştur
  const createOrder = useCallback(async (orderData) => {
    try {
      validateOrder(orderData);

      const order = {
        ...orderData,
        userId,
        status: ORDER_STATUS.NEW,
        filledQuantity: 0,
        remainingQuantity: orderData.quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Exchange order oluştur
      const exchangeOrder = await createExchangeOrder(order);
      order.exchangeOrderId = exchangeOrder.id;

      // Firestore'a kaydet
      const docRef = await addDoc(collection(db, COLLECTION_NAME), order);
      order.id = docRef.id;

      if (trackHistory) {
        const historyEntry = {
          type: 'create',
          timestamp: Date.now(),
          order: { ...order }
        };
        
        if (!orderHistoryRef.current.has(order.id)) {
          orderHistoryRef.current.set(order.id, []);
        }
        orderHistoryRef.current.get(order.id).push(historyEntry);
      }

      return order;

    } catch (err) {
      console.error('Order oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, validateOrder, createExchangeOrder, trackHistory]);

  // Order güncelle
  const updateOrder = useCallback(async (orderId, updates) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order bulunamadı');

      const updatedOrder = {
        ...order,
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, COLLECTION_NAME, orderId), updatedOrder);

      if (trackHistory) {
        const historyEntry = {
          type: 'update',
          timestamp: Date.now(),
          changes: updates
        };
        
        if (!orderHistoryRef.current.has(orderId)) {
          orderHistoryRef.current.set(orderId, []);
        }
        orderHistoryRef.current.get(orderId).push(historyEntry);
      }

      // Order dolduğunda wallet'ı güncelle
      if (updates.status === ORDER_STATUS.FILLED && order.status !== ORDER_STATUS.FILLED) {
        const [baseAsset, quoteAsset] = order.symbol.split('/');
        
        if (order.side === ORDER_SIDES.BUY) {
          await updateAsset({
            coinId: baseAsset,
            amount: order.quantity,
            purchasePrice: order.price
          });
        } else {
          await updateAsset({
            coinId: baseAsset,
            amount: -order.quantity
          });
        }
      }

      return updatedOrder;

    } catch (err) {
      console.error('Order güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [orders, updateAsset, trackHistory]);

  // Order iptal et
  const cancelOrder = useCallback(async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order bulunamadı');

      if (![ORDER_STATUS.NEW, ORDER_STATUS.PARTIALLY_FILLED].includes(order.status)) {
        throw new Error('Bu order iptal edilemez');
      }

      // Exchange order'ı iptal et
      await cancelExchangeOrder(order.exchangeOrderId);

      // Firestore'u güncelle
      await updateDoc(doc(db, COLLECTION_NAME, orderId), {
        status: ORDER_STATUS.CANCELED,
        updatedAt: new Date()
      });

      if (trackHistory) {
        const historyEntry = {
          type: 'cancel',
          timestamp: Date.now()
        };
        
        if (!orderHistoryRef.current.has(orderId)) {
          orderHistoryRef.current.set(orderId, []);
        }
        orderHistoryRef.current.get(orderId).push(historyEntry);
      }

      return true;

    } catch (err) {
      console.error('Order iptal hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [orders, cancelExchangeOrder, trackHistory]);

  // Orderları getir
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setOrders(cached.orders);
          setActiveOrders(cached.activeOrders);
          setOrderHistory(cached.orderHistory);
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
        const ordersData = [];
        snapshot.forEach(doc => {
          ordersData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        const activeOrdersData = ordersData.filter(order => 
          [ORDER_STATUS.NEW, ORDER_STATUS.PARTIALLY_FILLED].includes(order.status)
        );

        const orderHistoryData = ordersData.filter(order =>
          ![ORDER_STATUS.NEW, ORDER_STATUS.PARTIALLY_FILLED].includes(order.status)
        );

        setOrders(ordersData);
        setActiveOrders(activeOrdersData);
        setOrderHistory(orderHistoryData);
        
        saveToCache({
          orders: ordersData,
          activeOrders: activeOrdersData,
          orderHistory: orderHistoryData
        });
        
        lastFetchRef.current = Date.now();
        setIsDirty(false);
      });

      unsubscribeRef.current = unsubscribe;
      if (!silent) setLoading(false);

    } catch (err) {
      console.error('Order getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setOrders(cached.orders);
        setActiveOrders(cached.activeOrders);
        setOrderHistory(cached.orderHistory);
      }
    }
  }, [userId, loadFromCache, saveToCache]);

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoUpdate) return;

    updateTimeoutRef.current = setInterval(() => {
      fetchOrders(true);
    }, updateInterval);

    return () => {
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchOrders]);

  // İlk yükleme
  useEffect(() => {
    fetchOrders();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
      }
    };
  }, [fetchOrders]);

  // Memoized değerler
  const orderStats = useMemo(() => ({
    total: orders.length,
    active: activeOrders.length,
    history: orderHistory.length,
    byType: Object.fromEntries(
      Object.values(ORDER_TYPES).map(type => [
        type,
        orders.filter(o => o.type === type).length
      ])
    ),
    byStatus: Object.fromEntries(
      Object.values(ORDER_STATUS).map(status => [
        status,
        orders.filter(o => o.status === status).length
      ])
    ),
    bySide: Object.fromEntries(
      Object.values(ORDER_SIDES).map(side => [
        side,
        orders.filter(o => o.side === side).length
      ])
    ),
    history: Array.from(orderHistoryRef.current.entries()).map(([orderId, history]) => ({
      orderId,
      history: history.slice(-100) // Son 100 işlem
    })),
    lastUpdate: lastFetchRef.current
  }), [orders, activeOrders, orderHistory]);

  return {
    orders,
    activeOrders,
    orderHistory,
    stats: orderStats,
    loading,
    error,
    isDirty,
    createOrder,
    updateOrder,
    cancelOrder,
    refresh: fetchOrders,
    lastFetch: lastFetchRef.current
  };
}; 