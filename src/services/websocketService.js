import { API_CONFIG } from './apiConfig';

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
  }

  async connect(exchange, symbol, dataType) {
    const connectionKey = `${exchange}-${symbol}-${dataType}`;
    
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey);
    }

    let ws;
    switch (exchange) {
      case 'Binance':
        ws = this.connectBinance(symbol, dataType);
        break;
      case 'KuCoin':
        ws = await this.connectKucoin(symbol, dataType);
        break;
      // Diğer borsalar için benzer bağlantılar
      default:
        throw new Error('Desteklenmeyen borsa');
    }

    this.connections.set(connectionKey, ws);
    return ws;
  }

  connectBinance(symbol, dataType) {
    const ws = new WebSocket(`${API_CONFIG.BINANCE.WS_BASE}/${symbol.toLowerCase()}@${dataType}`);
    
    ws.onopen = () => {
      console.log(`Binance WebSocket bağlantısı açıldı: ${symbol}`);
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket hatası:', error);
    };

    return ws;
  }

  async connectKucoin(symbol, dataType) {
    // KuCoin için önce token almamız gerekiyor
    try {
      const response = await fetch(`${API_CONFIG.KUCOIN.REST_BASE}/bullet-public`);
      const data = await response.json();
      const token = data.token;
      
      const ws = new WebSocket(`${API_CONFIG.KUCOIN.WS_BASE}?token=${token}`);
      // KuCoin özel bağlantı mantığı
      return ws;
    } catch (error) {
      console.error('KuCoin WebSocket bağlantı hatası:', error);
      throw error;
    }
  }

  disconnect(exchange, symbol, dataType) {
    const connectionKey = `${exchange}-${symbol}-${dataType}`;
    const ws = this.connections.get(connectionKey);
    
    if (ws) {
      ws.close();
      this.connections.delete(connectionKey);
      this.subscriptions.delete(connectionKey);
    }
  }
}

export const wsManager = new WebSocketManager(); 