import { toast } from 'react-toastify';

export const NotificationTypes = {
  PRICE_ALERT: 'PRICE_ALERT',
  NEWS: 'NEWS',
  PORTFOLIO: 'PORTFOLIO',
  SYSTEM: 'SYSTEM'
};

export const NotificationPriorities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const showNotification = (message, type = 'info', priority = 'medium') => {
  const toastOptions = {
    position: "top-right",
    autoClose: priority === 'high' ? false : 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  switch (type) {
    case NotificationTypes.PRICE_ALERT:
      toast.success(message, toastOptions);
      break;
    case NotificationTypes.NEWS:
      toast.info(message, toastOptions);
      break;
    case NotificationTypes.PORTFOLIO:
      toast.warning(message, toastOptions);
      break;
    case NotificationTypes.SYSTEM:
      toast.error(message, toastOptions);
      break;
    default:
      toast(message, toastOptions);
  }
};

export const checkPriceAlerts = (currentPrice, alerts) => {
  alerts.forEach(alert => {
    if (alert.type === 'above' && currentPrice > alert.price) {
      showNotification(
        `${alert.coinId} fiyatı ${alert.price}$ üzerine çıktı!`,
        NotificationTypes.PRICE_ALERT,
        NotificationPriorities.HIGH
      );
    } else if (alert.type === 'below' && currentPrice < alert.price) {
      showNotification(
        `${alert.coinId} fiyatı ${alert.price}$ altına düştü!`,
        NotificationTypes.PRICE_ALERT,
        NotificationPriorities.HIGH
      );
    }
  });
}; 