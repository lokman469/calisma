import { exchangeService } from './exchangeService';
import { wsManager } from './websocketService';

class PriceAlertService {
  constructor() {
    this.alerts = new Map();
    this.activeSubscriptions = new Map();
  }

  async createAlert(params) {
    const { exchange, symbol, targetPrice, condition, note } = params;
    const alertId = `${exchange}-${symbol}-${Date.now()}`;
    
    const alert = {
      id: alertId,
      exchange,
      symbol,
      targetPrice: parseFloat(targetPrice),
      condition, // 'above' veya 'below'
      note,
      createdAt: new Date(),
      isActive: true
    };

    this.alerts.set(alertId, alert);
    await this.startMonitoring(alert);
    
    // LocalStorage'a kaydet
    this.saveToStorage();
    
    return alertId;
  }

  async startMonitoring(alert) {
    const subscriptionKey = `${alert.exchange}-${alert.symbol}`;
    
    if (!this.activeSubscriptions.has(subscriptionKey)) {
      const subscription = await wsManager.connect(
        alert.exchange,
        alert.symbol,
        'ticker',
        (price) => this.checkPrice(price, alert)
      );
      
      this.activeSubscriptions.set(subscriptionKey, subscription);
    }
  }

  checkPrice(currentPrice, alert) {
    if (!alert.isActive) return;

    const price = parseFloat(currentPrice);
    const triggered = alert.condition === 'above' 
      ? price >= alert.targetPrice 
      : price <= alert.targetPrice;

    if (triggered) {
      this.triggerAlert(alert, price);
    }
  }

  triggerAlert(alert, currentPrice) {
    alert.isActive = false;
    alert.triggeredAt = new Date();
    alert.triggerPrice = currentPrice;
    
    // Bildirim gönder
    this.sendNotification(alert);
    this.saveToStorage();
  }

  sendNotification(alert) {
    if (Notification.permission === 'granted') {
      new Notification('Fiyat Alarmı', {
        body: `${alert.symbol} ${alert.condition === 'above' ? 'üzerine çıktı' : 'altına düştü'}: ${alert.targetPrice}`,
        icon: '/favicon.ico'
      });
    }
  }

  saveToStorage() {
    const alertsData = Array.from(this.alerts.values());
    localStorage.setItem('priceAlerts', JSON.stringify(alertsData));
  }

  loadFromStorage() {
    const data = localStorage.getItem('priceAlerts');
    if (data) {
      const alerts = JSON.parse(data);
      alerts.forEach(alert => {
        this.alerts.set(alert.id, alert);
        if (alert.isActive) {
          this.startMonitoring(alert);
        }
      });
    }
  }
}

export const priceAlertService = new PriceAlertService(); 