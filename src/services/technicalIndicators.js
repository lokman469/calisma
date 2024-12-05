class TechnicalIndicators {
  async calculateRSI(symbol, period = 14) {
    try {
      const candles = await this.getCandles(symbol);
      const changes = this.calculatePriceChanges(candles);
      const gains = changes.map(change => change > 0 ? change : 0);
      const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

      const avgGain = this.calculateAverage(gains.slice(-period));
      const avgLoss = this.calculateAverage(losses.slice(-period));

      if (avgLoss === 0) return 100;
      
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    } catch (error) {
      console.error('RSI hesaplanamadı:', error);
      return null;
    }
  }

  async calculateMACD(symbol) {
    try {
      const candles = await this.getCandles(symbol);
      const prices = candles.map(candle => candle.close);

      const ema12 = this.calculateEMA(prices, 12);
      const ema26 = this.calculateEMA(prices, 26);
      const macdLine = ema12 - ema26;
      const signalLine = this.calculateEMA([macdLine], 9);

      return {
        macd: macdLine,
        signal: signalLine,
        histogram: macdLine - signalLine
      };
    } catch (error) {
      console.error('MACD hesaplanamadı:', error);
      return null;
    }
  }

  async calculateBollinger(symbol, period = 20, multiplier = 2) {
    try {
      const candles = await this.getCandles(symbol);
      const prices = candles.map(candle => candle.close);
      const sma = this.calculateSMA(prices, period);
      const stdDev = this.calculateStandardDeviation(prices, period);

      return {
        middle: sma,
        upper: sma + (multiplier * stdDev),
        lower: sma - (multiplier * stdDev)
      };
    } catch (error) {
      console.error('Bollinger Bands hesaplanamadı:', error);
      return null;
    }
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  calculateSMA(prices, period) {
    return this.calculateAverage(prices.slice(-period));
  }

  calculateStandardDeviation(prices, period) {
    const mean = this.calculateAverage(prices);
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    return Math.sqrt(this.calculateAverage(squaredDiffs));
  }

  calculateAverage(numbers) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  calculatePriceChanges(candles) {
    const changes = [];
    for (let i = 1; i < candles.length; i++) {
      changes.push(candles[i].close - candles[i - 1].close);
    }
    return changes;
  }

  async getCandles(symbol, interval = '1h', limit = 100) {
    // Borsa API'sinden mum verilerini al
    const response = await fetch(`/api/candles?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    return response.json();
  }
}

export const technicalIndicators = new TechnicalIndicators(); 