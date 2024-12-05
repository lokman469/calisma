import { toast } from 'react-toastify';

class NotificationService {
  constructor() {
    this.permission = null;
    this.supported = 'Notification' in window;
    this.worker = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (this.supported) {
      this.permission = await Notification.requestPermission();
      
      // Service Worker kaydı
      if ('serviceWorker' in navigator) {
        try {
          this.worker = await navigator.serviceWorker.register('/notification-worker.js');
          console.log('Service Worker başarıyla kaydedildi');
        } catch (error) {
          console.error('Service Worker kaydı başarısız:', error);
        }
      }
    }

    this.initialized = true;
  }

  // Push bildirim gönder
  async sendPushNotification(title, options = {}) {
    if (!this.supported || this.permission !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Push bildirim hatası:', error);
      return false;
    }
  }

  // Toast bildirim göster
  showToast(message, type = 'info') {
    toast[type](message, {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  // Fiyat alarmı bildirimi
  async sendPriceAlert(coin, price, condition) {
    const title = `${coin} Fiyat Alarmı`;
    const message = `${coin} fiyatı ${condition === 'above' ? 'üzerine çıktı' : 'altına düştü'}: $${price}`;

    this.showToast(message, 'warning');
    await this.sendPushNotification(title, {
      body: message,
      tag: 'price-alert',
      data: { coin, price, condition }
    });
  }

  // Portfolyo bildirimi
  async sendPortfolioAlert(type, data) {
    const messages = {
      profit: `${data.coin} pozisyonunuz %${data.percentage} kâr'da!`,
      loss: `${data.coin} pozisyonunuz %${data.percentage} zarar'da!`,
      target: `${data.coin} hedef fiyata ulaştı: $${data.price}`
    };

    this.showToast(messages[type], type === 'profit' ? 'success' : 'error');
    await this.sendPushNotification('Portfolyo Bildirimi', {
      body: messages[type],
      tag: 'portfolio-alert',
      data: { type, ...data }
    });
  }

  // Sistem bildirimi
  async sendSystemNotification(title, message, type = 'info') {
    this.showToast(message, type);
    await this.sendPushNotification(title, {
      body: message,
      tag: 'system',
      data: { type }
    });
  }
}

export const notificationService = new NotificationService(); 