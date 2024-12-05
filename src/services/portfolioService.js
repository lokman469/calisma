import { exchangeService } from './exchangeService';
import { API_CONFIG } from './apiConfig';

export const portfolioService = {
  async getBalances(exchange) {
    try {
      switch (exchange) {
        case 'Binance':
          return await this.getBinanceBalances();
        case 'KuCoin':
          return await this.getKucoinBalances();
        case 'Bybit':
          return await this.getBybitBalances();
        case 'MEXC':
          return await this.getMexcBalances();
        default:
          throw new Error('Desteklenmeyen borsa');
      }
    } catch (error) {
      console.error(`${exchange} bakiye hatası:`, error);
      throw error;
    }
  },

  async getBinanceBalances() {
    const timestamp = Date.now();
    const signature = createSignature(`timestamp=${timestamp}`, API_CONFIG.BINANCE.API_SECRET);
    
    const response = await fetch(`${API_CONFIG.BINANCE.REST_BASE}/api/v3/account?timestamp=${timestamp}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': API_CONFIG.BINANCE.API_KEY
      }
    });

    const data = await response.json();
    return data.balances.filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);
  },

  // Diğer borsalar için benzer metodlar...

  async getPortfolioValue() {
    const allBalances = {};
    const exchanges = ['Binance', 'KuCoin', 'Bybit', 'MEXC'];
    
    for (const exchange of exchanges) {
      try {
        const balances = await this.getBalances(exchange);
        allBalances[exchange] = balances;
      } catch (error) {
        console.error(`${exchange} portföy değeri hatası:`, error);
      }
    }

    return allBalances;
  }
}; 