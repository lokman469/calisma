import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useSettings } from './useSettings';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000;
const EVENT_BUFFER_SIZE = 100;

const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

const EVENT_TYPES = {
  MARKET: 'market',
  TRADE: 'trade',
  ORDER: 'order',
  BALANCE: 'balance',
  NOTIFICATION: 'notification',
  SYSTEM: 'system'
};

export const useSocket = (options = {}) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [error, setError] = useState(null);
  const [lastPing, setLastPing] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const eventListenersRef = useRef(new Map());
  const eventBufferRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const lastEventRef = useRef(null);

  const { settings } = useSettings();

  const {
    autoConnect = true,
    autoReconnect = true,
    secure = true,
    compression = true,
    bufferEvents = true,
    debug = false,
    path = '/socket',
    query = {},
    extraHeaders = {}
  } = options;

  // Socket bağlantısı oluştur
  const createSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    socketRef.current = io(SOCKET_URL, {
      secure,
      path,
      query,
      extraHeaders,
      reconnection: false,
      transports: ['websocket'],
      compression,
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });

    // Temel event listener'ları ekle
    socketRef.current.on('connect', () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setReconnectAttempts(0);
      setError(null);
      
      // Ping interval'ı başlat
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        socketRef.current.emit('ping', Date.now());
      }, PING_INTERVAL);

      if (debug) {
        console.log('Socket bağlantısı kuruldu');
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      clearInterval(pingIntervalRef.current);

      if (debug) {
        console.log('Socket bağlantısı kesildi:', reason);
      }

      if (autoReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        handleReconnect();
      }
    });

    socketRef.current.on('error', (err) => {
      setConnectionState(CONNECTION_STATES.ERROR);
      setError(err.message);

      if (debug) {
        console.error('Socket hatası:', err);
      }
    });

    socketRef.current.on('ping', () => {
      setLastPing(Date.now());
    });

    // Event buffer'ı temizle
    if (bufferEvents) {
      eventBufferRef.current.clear();
    }

  }, [secure, path, query, extraHeaders, compression, autoReconnect, debug, bufferEvents]);

  // Yeniden bağlanma
  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionState(CONNECTION_STATES.RECONNECTING);
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (debug) {
        console.log(`Yeniden bağlanma denemesi: ${reconnectAttempts + 1}`);
      }
      createSocket();
    }, RECONNECT_DELAY);
  }, [createSocket, debug, reconnectAttempts]);

  // Event listener ekle
  const addEventListener = useCallback((eventType, callback) => {
    if (!eventListenersRef.current.has(eventType)) {
      eventListenersRef.current.set(eventType, new Set());
    }

    const listeners = eventListenersRef.current.get(eventType);
    listeners.add(callback);

    // Socket event listener'ı ekle
    socketRef.current?.on(eventType, (data) => {
      // Event'i buffer'a ekle
      if (bufferEvents) {
        if (!eventBufferRef.current.has(eventType)) {
          eventBufferRef.current.set(eventType, []);
        }
        const buffer = eventBufferRef.current.get(eventType);
        buffer.push({
          timestamp: Date.now(),
          data
        });
        // Buffer boyutunu kontrol et
        if (buffer.length > EVENT_BUFFER_SIZE) {
          buffer.shift();
        }
      }

      // Callback'leri çağır
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Event listener hatası (${eventType}):`, err);
        }
      });

      lastEventRef.current = {
        type: eventType,
        timestamp: Date.now()
      };
    });

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        socketRef.current?.off(eventType);
        eventListenersRef.current.delete(eventType);
      }
    };
  }, [bufferEvents]);

  // Event emit
  const emit = useCallback((eventType, data) => {
    if (connectionState !== CONNECTION_STATES.CONNECTED) {
      throw new Error('Socket bağlı değil');
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit(eventType, data, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [connectionState]);

  // Kanala abone ol
  const subscribe = useCallback((channel) => {
    if (connectionState !== CONNECTION_STATES.CONNECTED) {
      throw new Error('Socket bağlı değil');
    }

    return emit('subscribe', { channel });
  }, [connectionState, emit]);

  // Kanal aboneliğini iptal et
  const unsubscribe = useCallback((channel) => {
    if (connectionState !== CONNECTION_STATES.CONNECTED) {
      throw new Error('Socket bağlı değil');
    }

    return emit('unsubscribe', { channel });
  }, [connectionState, emit]);

  // Bağlantıyı kapat
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    setError(null);
    setReconnectAttempts(0);
  }, []);

  // İlk bağlantı
  useEffect(() => {
    if (autoConnect) {
      createSocket();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, createSocket, disconnect]);

  // Memoized değerler
  const socketState = useMemo(() => ({
    connectionState,
    error,
    lastPing,
    reconnectAttempts,
    eventBuffer: Object.fromEntries(
      Array.from(eventBufferRef.current.entries()).map(([type, events]) => [
        type,
        events.slice(-10) // Son 10 event
      ])
    ),
    stats: {
      totalEvents: Array.from(eventBufferRef.current.values())
        .reduce((sum, events) => sum + events.length, 0),
      eventTypes: Array.from(eventListenersRef.current.keys()),
      lastEvent: lastEventRef.current
    }
  }), [connectionState, error, lastPing, reconnectAttempts]);

  return {
    ...socketState,
    socket: socketRef.current,
    addEventListener,
    emit,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: handleReconnect
  };
}; 