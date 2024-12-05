import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSettings } from './useSettings';

const COLLECTION_NAME = 'notifications';
const CACHE_KEY = 'notifications_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 saat

const NOTIFICATION_TYPES = {
  PRICE_ALERT: 'price_alert',
  TRADE: 'trade',
  NEWS: 'news',
  SYSTEM: 'system',
  SECURITY: 'security',
  UPDATE: 'update'
};

const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

const DELIVERY_CHANNELS = {
  APP: 'app',
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms'
};

export const useNotifications = (userId, options = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');
  
  const unsubscribeRef = useRef(null);
  const lastFetchRef = useRef(null);
  const soundRef = useRef(null);
  const notificationHistoryRef = useRef(new Map());

  const { settings } = useSettings(userId);

  const {
    enableCache = true,
    autoCleanup = true,
    cleanupAge = 30 * 24 * 60 * 60 * 1000, // 30 gün
    maxNotifications = 100,
    enableSound = true,
    enableVibration = true,
    groupSimilar = true,
    defaultPriority = NOTIFICATION_PRIORITIES.MEDIUM,
    defaultChannel = DELIVERY_CHANNELS.APP
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

  // Bildirim izinlerini kontrol et
  const checkPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    const currentPermission = await Notification.permission;
    setPermission(currentPermission);
    return currentPermission === 'granted';
  }, []);

  // Bildirim izni iste
  const requestPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (err) {
      console.error('Bildirim izni hatası:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Bildirimleri getir
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setNotifications(cached);
          setUnreadCount(cached.filter(n => n.status === NOTIFICATION_STATUS.UNREAD).length);
          setLoading(false);
          return;
        }
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', '!=', NOTIFICATION_STATUS.DELETED),
        orderBy('status'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsData = [];
        snapshot.forEach(doc => {
          notificationsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Benzer bildirimleri grupla
        if (groupSimilar) {
          const grouped = notificationsData.reduce((acc, notification) => {
            const key = `${notification.type}_${notification.title}`;
            if (!acc[key]) {
              acc[key] = { ...notification, count: 1 };
            } else {
              acc[key].count++;
              if (notification.createdAt > acc[key].createdAt) {
                acc[key].createdAt = notification.createdAt;
              }
            }
            return acc;
          }, {});
          
          notificationsData = Object.values(grouped);
        }

        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => n.status === NOTIFICATION_STATUS.UNREAD).length);
        saveToCache(notificationsData);
        lastFetchRef.current = Date.now();

        // Geçmişe ekle
        notificationsData.forEach(notification => {
          if (!notificationHistoryRef.current.has(notification.id)) {
            notificationHistoryRef.current.set(notification.id, {
              ...notification,
              statusHistory: [{
                status: notification.status,
                timestamp: Date.now()
              }]
            });
          }
        });
      });

      unsubscribeRef.current = unsubscribe;
      if (!silent) setLoading(false);

    } catch (err) {
      console.error('Bildirimleri getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);

      // Cache'den yükle
      const cached = loadFromCache();
      if (cached) {
        setNotifications(cached);
        setUnreadCount(cached.filter(n => n.status === NOTIFICATION_STATUS.UNREAD).length);
      }
    }
  }, [userId, groupSimilar, loadFromCache, saveToCache]);

  // Bildirim oluştur
  const createNotification = useCallback(async (notificationData) => {
    try {
      const notification = {
        userId,
        status: NOTIFICATION_STATUS.UNREAD,
        priority: notificationData.priority || defaultPriority,
        channel: notificationData.channel || defaultChannel,
        createdAt: new Date(),
        ...notificationData
      };

      // Maksimum bildirim sayısını kontrol et
      if (notifications.length >= maxNotifications) {
        const oldestNotification = notifications
          .filter(n => n.status === NOTIFICATION_STATUS.READ)
          .sort((a, b) => a.createdAt - b.createdAt)[0];
          
        if (oldestNotification) {
          await deleteDoc(doc(db, COLLECTION_NAME, oldestNotification.id));
        }
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), notification);

      // Ses ve titreşim
      if (enableSound && settings?.notifications?.sound) {
        soundRef.current = new Audio('/notification.mp3');
        await soundRef.current.play();
      }

      if (enableVibration && settings?.notifications?.vibration) {
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      }

      // Push notification
      if (notification.channel === DELIVERY_CHANNELS.PUSH && permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png',
          badge: '/notification-badge.png',
          tag: notification.id
        });
      }

      return docRef.id;

    } catch (err) {
      console.error('Bildirim oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [userId, notifications.length, maxNotifications, permission, defaultPriority, defaultChannel, enableSound, enableVibration, settings]);

  // Bildirim güncelle
  const updateNotification = useCallback(async (notificationId, updates) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        throw new Error('Bildirim bulunamadı');
      }

      // Status geçmişini güncelle
      if (updates.status && updates.status !== notification.status) {
        const history = notificationHistoryRef.current.get(notificationId);
        if (history) {
          history.statusHistory.push({
            status: updates.status,
            timestamp: Date.now()
          });
        }
      }

      await updateDoc(doc(db, COLLECTION_NAME, notificationId), {
        ...updates,
        updatedAt: new Date()
      });

      return true;

    } catch (err) {
      console.error('Bildirim güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [notifications]);

  // Bildirimi sil
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, notificationId), {
        status: NOTIFICATION_STATUS.DELETED,
        deletedAt: new Date()
      });

      notificationHistoryRef.current.delete(notificationId);
      return true;

    } catch (err) {
      console.error('Bildirim silme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Bildirimi okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId) => {
    return updateNotification(notificationId, {
      status: NOTIFICATION_STATUS.READ,
      readAt: new Date()
    });
  }, [updateNotification]);

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      
      notifications
        .filter(n => n.status === NOTIFICATION_STATUS.UNREAD)
        .forEach(notification => {
          const ref = doc(db, COLLECTION_NAME, notification.id);
          batch.update(ref, {
            status: NOTIFICATION_STATUS.READ,
            readAt: new Date()
          });

          // Status geçmişini güncelle
          const history = notificationHistoryRef.current.get(notification.id);
          if (history) {
            history.statusHistory.push({
              status: NOTIFICATION_STATUS.READ,
              timestamp: Date.now()
            });
          }
        });

      await batch.commit();
      return true;

    } catch (err) {
      console.error('Toplu güncelleme hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [notifications]);

  // Eski bildirimleri temizle
  useEffect(() => {
    if (!autoCleanup) return;

    const cleanup = async () => {
      try {
        const oldNotifications = notifications.filter(
          n => Date.now() - n.createdAt.toMillis() > cleanupAge &&
          n.status === NOTIFICATION_STATUS.READ
        );

        if (oldNotifications.length > 0) {
          const batch = writeBatch(db);
          
          oldNotifications.forEach(notification => {
            const ref = doc(db, COLLECTION_NAME, notification.id);
            batch.update(ref, {
              status: NOTIFICATION_STATUS.DELETED,
              deletedAt: new Date()
            });
            notificationHistoryRef.current.delete(notification.id);
          });

          await batch.commit();
        }
      } catch (err) {
        console.error('Temizleme hatası:', err);
      }
    };

    const cleanupInterval = setInterval(cleanup, 24 * 60 * 60 * 1000); // 24 saat

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [autoCleanup, cleanupAge, notifications]);

  // İlk yükleme
  useEffect(() => {
    checkPermission();
    fetchNotifications();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current = null;
      }
    };
  }, [checkPermission, fetchNotifications]);

  // Memoized değerler
  const notificationStats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    byType: Object.fromEntries(
      Object.values(NOTIFICATION_TYPES).map(type => [
        type,
        notifications.filter(n => n.type === type).length
      ])
    ),
    byPriority: Object.fromEntries(
      Object.values(NOTIFICATION_PRIORITIES).map(priority => [
        priority,
        notifications.filter(n => n.priority === priority).length
      ])
    ),
    byStatus: Object.fromEntries(
      Object.values(NOTIFICATION_STATUS).map(status => [
        status,
        notifications.filter(n => n.status === status).length
      ])
    ),
    history: Array.from(notificationHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data
    })),
    lastUpdate: lastFetchRef.current
  }), [notifications, unreadCount]);

  return {
    notifications,
    stats: notificationStats,
    unreadCount,
    loading,
    error,
    permission,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    requestPermission,
    refresh: fetchNotifications,
    lastFetch: lastFetchRef.current
  };
}; 