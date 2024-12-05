import { useEffect, useCallback } from 'react';
import { wsService } from '../services/api';

export function useWebSocket(type, callback) {
  const handleMessage = useCallback((data) => {
    callback(data);
  }, [callback]);

  useEffect(() => {
    if (!wsService.ws) {
      wsService.connect();
    }

    const unsubscribe = wsService.subscribe(type, handleMessage);
    return () => unsubscribe();
  }, [type, handleMessage]);

  const sendMessage = useCallback((data) => {
    wsService.send(data);
  }, []);

  return { sendMessage };
} 