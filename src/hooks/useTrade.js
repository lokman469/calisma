import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useExchange } from './useExchange';
import { useWallet } from './useWallet';
import { useOrders } from './useOrders';

const COLLECTION_NAME = 'trades';
const CACHE_KEY = 'trade_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

const TRADE_TYPES = {
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures',
  OPTION: 'option'
};

const TRADE_SIDES = {
  LONG: 'long',
  SHORT: 'short'
};

const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_MARKET: 'stop_market',
  STOP_LIMIT: 'stop_limit',
  TRAILING_STOP: 'trailing_stop'
};

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const useTrade = (userId, options = {}) => {
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  
  const lastTradeRef = useRef(null);
  const positionUpdatesRef = useRef(new Map());
  const tradeHistoryRef = useRef(new Map());
  const riskCalculatorRef = useRef(null);

  const { exchange, markets } = useExchange();
  const { wallet, updateAsset } = useWallet(userId);
  const { createOrder, updateOrder } = useOrders(userId);

  const {
    enableRiskManagement = true,
    maxPositions = 5,
    maxLeverage = 10,
    stopLossRequired = true,
    takeProfitRequired = false,
    defaultRiskPerTrade = 0.01, // %1
    defaultTimeInForce = 'GTC',
    validateBalance = true,
    trackHistory = true
  } = options;

  // Risk hesaplama
  const calculateRisk = useCallback((tradeParams) => {
    const {
      symbol,
      side,
      quantity,
      leverage = 1,
      entryPrice,
      stopLoss,
      takeProfit
    } = tradeParams;

    const position = positions.find(p => p.symbol === symbol);
    const market = markets[symbol];
    
    if (!market) {
      throw new Error('Geçersiz market');
    }

    const notionalValue = quantity * entryPrice;
    const exposureValue = notionalValue * leverage;
    
    // Stop loss risk
    const stopLossRisk = stopLoss 
      ? Math.abs(entryPrice - stopLoss) * quantity
      : notionalValue;

    // Risk metrikleri
    const metrics = {
      notionalValue,
      exposureValue,
      leverage,
      stopLossRisk,
      riskPercentage: (stopLossRisk / wallet.totalValue) * 100,
      marginRequired: notionalValue / leverage,
      liquidationPrice: calculateLiquidationPrice(
        entryPrice,
        leverage,
        side === TRADE_SIDES.LONG
      ),
      profitPotential: takeProfit 
        ? Math.abs(takeProfit - entryPrice) * quantity
        : 0,
      riskRewardRatio: takeProfit && stopLoss
        ? Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss)
        : 0
    };

    setRiskMetrics(metrics);
    return metrics;
  }, [positions, markets, wallet.totalValue]);

  // Trade oluştur
  const createTrade = useCallback(async (tradeParams) => {
    try {
      const {
        symbol,
        type = ORDER_TYPES.MARKET,
        side,
        quantity,
        price,
        leverage = 1,
        stopLoss,
        takeProfit,
        timeInForce = defaultTimeInForce
      } = tradeParams;

      // Validasyonlar
      if (enableRiskManagement) {
        // Pozisyon limiti kontrolü
        if (positions.length >= maxPositions) {
          throw new Error('Maksimum pozisyon limitine ulaşıldı');
        }

        // Kaldıraç kontrolü
        if (leverage > maxLeverage) {
          throw new Error('Maksimum kaldıraç limitini aştınız');
        }

        // Stop loss kontrolü
        if (stopLossRequired && !stopLoss) {
          throw new Error('Stop loss zorunludur');
        }

        // Take profit kontrolü
        if (takeProfitRequired && !takeProfit) {
          throw new Error('Take profit zorunludur');
        }

        // Risk hesaplama
        const riskMetrics = calculateRisk(tradeParams);
        if (riskMetrics.riskPercentage > defaultRiskPerTrade) {
          throw new Error('İşlem riski çok yüksek');
        }
      }

      // Order oluştur
      const order = await createOrder({
        symbol,
        type,
        side,
        quantity,
        price,
        leverage,
        stopLoss,
        takeProfit,
        timeInForce
      });

      // Trade kaydı oluştur
      const trade = {
        orderId: order.id,
        userId,
        symbol,
        type,
        side,
        quantity,
        price: order.price,
        leverage,
        stopLoss,
        takeProfit,
        status: 'open',
        entryTime: new Date(),
        risk: riskMetrics,
        pnl: 0
      };

      const tradeDoc = await addDoc(collection(db, COLLECTION_NAME), trade);
      
      // Position güncelle
      updatePosition(symbol, trade);
      
      // History kaydet
      if (trackHistory) {
        tradeHistoryRef.current.set(tradeDoc.id, {
          ...trade,
          history: [{
            type: 'open',
            timestamp: Date.now(),
            data: trade
          }]
        });
      }

      lastTradeRef.current = trade;
      return { ...trade, id: tradeDoc.id };

    } catch (err) {
      console.error('Trade oluşturma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [
    enableRiskManagement,
    maxPositions,
    maxLeverage,
    stopLossRequired,
    takeProfitRequired,
    defaultRiskPerTrade,
    defaultTimeInForce,
    positions,
    calculateRisk,
    createOrder,
    userId,
    trackHistory
  ]);

  // Position güncelle
  const updatePosition = useCallback((symbol, trade) => {
    setPositions(prev => {
      const existingPosition = prev.find(p => p.symbol === symbol);
      
      if (existingPosition) {
        // Mevcut pozisyonu güncelle
        return prev.map(p => p.symbol === symbol ? {
          ...p,
          quantity: trade.side === TRADE_SIDES.LONG
            ? p.quantity + trade.quantity
            : p.quantity - trade.quantity,
          averagePrice: calculateAveragePrice(p, trade),
          lastUpdate: new Date()
        } : p);
      } else {
        // Yeni pozisyon oluştur
        return [...prev, {
          symbol,
          side: trade.side,
          quantity: trade.quantity,
          averagePrice: trade.price,
          leverage: trade.leverage,
          openTime: new Date(),
          lastUpdate: new Date(),
          pnl: 0,
          trades: [trade.id]
        }];
      }
    });

    // Position güncellemelerini kaydet
    if (!positionUpdatesRef.current.has(symbol)) {
      positionUpdatesRef.current.set(symbol, []);
    }
    positionUpdatesRef.current.get(symbol).push({
      timestamp: Date.now(),
      trade
    });
  }, []);

  // Trade kapat
  const closeTrade = useCallback(async (tradeId, closeParams = {}) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) {
        throw new Error('Trade bulunamadı');
      }

      const closeOrder = await createOrder({
        symbol: trade.symbol,
        type: closeParams.type || ORDER_TYPES.MARKET,
        side: trade.side === TRADE_SIDES.LONG ? 'sell' : 'buy',
        quantity: closeParams.quantity || trade.quantity,
        price: closeParams.price
      });

      await updateDoc(doc(db, COLLECTION_NAME, tradeId), {
        status: 'closed',
        exitTime: new Date(),
        exitPrice: closeOrder.price,
        pnl: calculatePnL(trade, closeOrder.price)
      });

      // Position güncelle
      updatePosition(trade.symbol, {
        ...trade,
        side: trade.side === TRADE_SIDES.LONG ? 'sell' : 'buy',
        quantity: closeParams.quantity || trade.quantity,
        price: closeOrder.price
      });

      // History güncelle
      if (trackHistory) {
        const tradeHistory = tradeHistoryRef.current.get(tradeId);
        if (tradeHistory) {
          tradeHistory.history.push({
            type: 'close',
            timestamp: Date.now(),
            data: closeOrder
          });
        }
      }

      return closeOrder;

    } catch (err) {
      console.error('Trade kapatma hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [trades, createOrder, updatePosition, trackHistory]);

  // Pozisyonları getir
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', '==', 'open'),
      orderBy('entryTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const openTrades = [];
      snapshot.forEach(doc => {
        openTrades.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTrades(openTrades);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Memoized değerler
  const tradeStats = useMemo(() => ({
    totalTrades: trades.length,
    openPositions: positions.length,
    totalPnL: positions.reduce((sum, pos) => sum + pos.pnl, 0),
    byType: Object.fromEntries(
      Object.values(TRADE_TYPES).map(type => [
        type,
        trades.filter(t => t.type === type).length
      ])
    ),
    bySide: Object.fromEntries(
      Object.values(TRADE_SIDES).map(side => [
        side,
        trades.filter(t => t.side === side).length
      ])
    ),
    riskMetrics,
    history: Array.from(tradeHistoryRef.current.entries()).map(([id, data]) => ({
      id,
      ...data
    })),
    lastTrade: lastTradeRef.current
  }), [trades, positions, riskMetrics]);

  return {
    trades,
    positions,
    stats: tradeStats,
    loading,
    error,
    createTrade,
    closeTrade,
    calculateRisk
  };
}; 