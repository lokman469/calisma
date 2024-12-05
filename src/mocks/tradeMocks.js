import { faker } from '@faker-js/faker';

// İşlem tipleri
const TRADE_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_MARKET: 'stop_market',
  STOP_LIMIT: 'stop_limit',
  TRAILING_STOP: 'trailing_stop'
};

// İşlem yönleri
const TRADE_SIDES = {
  BUY: 'buy',
  SELL: 'sell'
};

// İşlem durumları
const TRADE_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

// Temel işlem oluşturucu
export const createMockTrade = (overrides = {}) => {
  const type = faker.helpers.arrayElement(Object.values(TRADE_TYPES));
  const side = faker.helpers.arrayElement(Object.values(TRADE_SIDES));
  const status = faker.helpers.arrayElement(Object.values(TRADE_STATUS));
  const price = faker.number.float({ min: 100, max: 50000, precision: 0.01 });
  const quantity = faker.number.float({ min: 0.1, max: 10, precision: 0.001 });

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    symbol: 'BTC/USDT',
    type,
    side,
    status,
    price,
    quantity,
    amount: price * quantity,
    filled: status === TRADE_STATUS.CLOSED ? quantity : faker.number.float({ min: 0, max: quantity }),
    remaining: status === TRADE_STATUS.CLOSED ? 0 : faker.number.float({ min: 0, max: quantity }),
    cost: price * quantity,
    fee: {
      currency: 'USDT',
      cost: price * quantity * 0.001,
      rate: 0.001
    },
    stopPrice: type.includes('STOP') ? price * (side === TRADE_SIDES.BUY ? 1.01 : 0.99) : null,
    limitPrice: type.includes('LIMIT') ? price : null,
    trailingOffset: type === TRADE_TYPES.TRAILING_STOP ? faker.number.float({ min: 1, max: 5 }) : null,
    leverage: 1,
    margin: 0,
    pnl: status === TRADE_STATUS.CLOSED ? faker.number.float({ min: -1000, max: 1000 }) : 0,
    tags: [],
    note: faker.lorem.sentence(),
    metadata: {},
    timestamps: {
      created: faker.date.past(),
      updated: faker.date.recent(),
      opened: status !== TRADE_STATUS.PENDING ? faker.date.recent() : null,
      closed: status === TRADE_STATUS.CLOSED ? faker.date.recent() : null
    },
    ...overrides
  };
};

// Çoklu işlem oluşturucu
export const createMockTrades = (count = 10, overrides = {}) => {
  return Array.from({ length: count }, () => createMockTrade(overrides));
};

// İşlem geçmişi oluşturucu
export const createMockTradeHistory = (userId, count = 100) => {
  const trades = createMockTrades(count, { 
    userId,
    status: TRADE_STATUS.CLOSED 
  });

  let balance = 10000;
  const history = trades.map(trade => {
    const pnl = faker.number.float({ min: -1000, max: 1000 });
    balance += pnl;

    return {
      ...trade,
      pnl,
      balance,
      roi: (pnl / trade.cost) * 100
    };
  });

  return history.sort((a, b) => 
    a.timestamps.closed.getTime() - b.timestamps.closed.getTime()
  );
};

// Pozisyon oluşturucu
export const createMockPosition = (overrides = {}) => {
  const entryPrice = faker.number.float({ min: 100, max: 50000 });
  const currentPrice = faker.number.float({ min: 100, max: 50000 });
  const size = faker.number.float({ min: 0.1, max: 10 });
  const side = faker.helpers.arrayElement(Object.values(TRADE_SIDES));
  const pnl = (currentPrice - entryPrice) * size * (side === TRADE_SIDES.BUY ? 1 : -1);

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    symbol: 'BTC/USDT',
    side,
    size,
    entryPrice,
    currentPrice,
    liquidationPrice: side === TRADE_SIDES.BUY 
      ? entryPrice * 0.8 
      : entryPrice * 1.2,
    leverage: faker.number.int({ min: 1, max: 20 }),
    margin: size * entryPrice / faker.number.int({ min: 1, max: 20 }),
    pnl,
    roi: (pnl / (size * entryPrice)) * 100,
    stopLoss: side === TRADE_SIDES.BUY 
      ? entryPrice * 0.95 
      : entryPrice * 1.05,
    takeProfit: side === TRADE_SIDES.BUY 
      ? entryPrice * 1.05 
      : entryPrice * 0.95,
    timestamps: {
      opened: faker.date.past(),
      updated: faker.date.recent()
    },
    metadata: {},
    ...overrides
  };
};

// Çoklu pozisyon oluşturucu
export const createMockPositions = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, () => createMockPosition(overrides));
};

// İşlem istatistikleri oluşturucu
export const createMockTradeStats = (userId, overrides = {}) => {
  const totalTrades = faker.number.int({ min: 100, max: 1000 });
  const winRate = faker.number.float({ min: 0.4, max: 0.7 });
  const winningTrades = Math.floor(totalTrades * winRate);
  const losingTrades = totalTrades - winningTrades;

  return {
    userId,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: winRate * 100,
    profitFactor: faker.number.float({ min: 1, max: 3 }),
    totalPnl: faker.number.float({ min: -10000, max: 50000 }),
    averagePnl: faker.number.float({ min: -100, max: 500 }),
    maxDrawdown: faker.number.float({ min: -5000, max: -1000 }),
    sharpeRatio: faker.number.float({ min: 0, max: 3 }),
    averageHoldingTime: faker.number.float({ min: 1, max: 48 }),
    bestTrade: faker.number.float({ min: 1000, max: 5000 }),
    worstTrade: faker.number.float({ min: -5000, max: -1000 }),
    metadata: {},
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

export { TRADE_TYPES, TRADE_SIDES, TRADE_STATUS }; 