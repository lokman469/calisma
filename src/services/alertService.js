import { wsManager } from './websocketService';

class PriceAlert {
  constructor(exchange, symbol, targetPrice, condition, callback) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.targetPrice = targetPrice;
    this.condition = condition; // 'above' veya 'below'
    this.callback = callback;
    this.active = true;
  }

  check(currentPrice) {
    if (!this.active) return;

    if (this.condition === 'above' && currentPrice >= this.targetPrice) {
      this.trigger(currentPrice);
    } else if (this.condition === 'below' && currentPrice <= this.targetPrice) {
      this.trigger(currentPrice);
    }
  }

  trigger(currentPrice) {
    this.callback({
      exchange: this.exchange,
      symbol: this.symbol,
      targetPrice: this.targetPrice,
      currentPrice: currentPrice,
      condition: this.condition
    });
    this.active = false;
  }
}

export const alertService = {
  alerts: new Map(),

  createAlert(exchange, symbol, targetPrice, condition, callback) {
    const alertId = `${exchange}-${symbol}-${targetPrice}-${condition}-${Date.now()}`;
    const alert = new PriceAlert(exchange, symbol, targetPrice, condition, callback);
    this.alerts.set(alertId, alert);

    // WebSocket bağlantısı kur
    this.subscribeToPrice(exchange, symbol);

    return alertId;
  },

  removeAlert(alertId) {
    this.alerts.delete(alertId);
  },

  async subscribeToPrice(exchange, symbol) {
    try {
      await wsManager.connect(exchange, symbol, 'ticker', (data) => {
        const price = parseFloat(data.price);
        // Tüm ilgili alarmları kontrol et
        this.alerts.forEach(alert => {
          if (alert.exchange === exchange && alert.symbol === symbol) {
            alert.check(price);
          }
        });
      });
    } catch (error) {
      console.error('Fiyat takibi hatası:', error);
    }
  }
}; 