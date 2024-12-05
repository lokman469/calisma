import { technicalIndicators } from './technicalIndicators';

class ConditionalAlertService {
  constructor() {
    this.conditions = new Map();
  }

  createConditionalAlert(params) {
    const {
      exchange,
      symbol,
      conditions,
      logic = 'AND',
      notifications,
      note
    } = params;

    const alertId = `${exchange}-${symbol}-${Date.now()}`;
    
    const alert = {
      id: alertId,
      exchange,
      symbol,
      conditions,
      logic,
      notifications,
      note,
      isActive: true,
      createdAt: new Date(),
      lastCheck: null,
      triggerCount: 0
    };

    this.conditions.set(alertId, alert);
    return alertId;
  }

  async checkConditions(alert, marketData) {
    const results = await Promise.all(
      alert.conditions.map(condition => this.evaluateCondition(condition, marketData))
    );

    alert.lastCheck = new Date();

    if (alert.logic === 'AND') {
      return results.every(result => result);
    }
    return results.some(result => result);
  }

  async evaluateCondition(condition, marketData) {
    switch (condition.indicator) {
      case 'price':
        return this.checkPrice(marketData.price, condition);
      
      case 'volume':
        return this.checkVolume(marketData.volume, condition);
      
      case 'rsi':
        return this.checkRSI(marketData.rsi, condition);
      
      case 'macd':
        return this.checkMACD(marketData.macd, condition);
      
      case 'bollinger':
        return this.checkBollinger(marketData.bollinger, condition);
      
      default:
        throw new Error(`Bilinmeyen indikatör: ${condition.indicator}`);
    }
  }

  checkPrice(currentPrice, condition) {
    const price = parseFloat(currentPrice);
    const target = parseFloat(condition.value);

    switch (condition.operator) {
      case 'above':
        return price > target;
      case 'below':
        return price < target;
      case 'equals':
        return Math.abs(price - target) < 0.0001;
      default:
        return false;
    }
  }

  checkVolume(currentVolume, condition) {
    return currentVolume > condition.value;
  }

  async checkRSI(symbol, condition) {
    const rsi = await technicalIndicators.calculateRSI(symbol);
    return condition.operator === 'above' 
      ? rsi > condition.value 
      : rsi < condition.value;
  }

  async checkMACD(symbol, condition) {
    const macd = await technicalIndicators.calculateMACD(symbol);
    return condition.operator === 'crossover' 
      ? macd.histogram > 0 
      : macd.histogram < 0;
  }

  async checkBollinger(symbol, condition) {
    const bollinger = await technicalIndicators.calculateBollinger(symbol);
    const price = await technicalIndicators.getCurrentPrice(symbol);

    switch (condition.operator) {
      case 'above_upper':
        return price > bollinger.upper;
      case 'below_lower':
        return price < bollinger.lower;
      case 'inside':
        return price > bollinger.lower && price < bollinger.upper;
      default:
        return false;
    }
  }
}

export const conditionalAlertService = new ConditionalAlertService(); 