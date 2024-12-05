import { createContext, useContext, useEffect } from 'react';
import { notificationService } from '../services/notification';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { settings } = useUser();

  useEffect(() => {
    notificationService.init();
  }, []);

  const sendNotification = async (type, data) => {
    if (!settings?.notifications?.[type]) return;

    switch (type) {
      case 'price':
        await notificationService.sendPriceAlert(
          data.coin,
          data.price,
          data.condition
        );
        break;
      case 'portfolio':
        await notificationService.sendPortfolioAlert(
          data.alertType,
          data
        );
        break;
      case 'system':
        await notificationService.sendSystemNotification(
          data.title,
          data.message,
          data.type
        );
        break;
      default:
        console.warn('Bilinmeyen bildirim tipi:', type);
    }
  };

  return (
    <NotificationContext.Provider value={{ sendNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 