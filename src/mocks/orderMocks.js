import { faker } from '@faker-js/faker';

// Emir tipleri
const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_MARKET: 'stop_market',
  STOP_LIMIT: 'stop_limit',
  TRAILING_STOP: 'trailing_stop',
  OCO: 'oco', // One Cancels Other
  ICEBERG: 'iceberg',
  FOK: 'fok', // Fill or Kill
  IOC: 'ioc'  // Immediate or Cancel
};

// Emir yönleri
const ORDER_SIDES = {
  BUY: 'buy',
  SELL: 'sell'
};

// Emir durumları
const ORDER_STATUS = {
  NEW: 'new',
  PARTIALLY_FILLED: 'partially_filled',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Temel emir oluşturucu
export const createMockOrder = (overrides = {}) => {
  const type = faker.helpers.arrayElement(Object.values(ORDER_TYPES));
  const side = faker.helpers.arrayElement(Object.values(ORDER_SIDES));
  const status = faker.helpers.arrayElement(Object.values(ORDER_STATUS));
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
    filled: status === ORDER_STATUS.FILLED ? quantity : 
            status === ORDER_STATUS.PARTIALLY_FILLED ? 
            faker.number.float({ min: 0, max: quantity }) : 0,
    remaining: status === ORDER_STATUS.FILLED ? 0 : 
               status === ORDER_STATUS.PARTIALLY_FILLED ? 
               faker.number.float({ min: 0, max: quantity }) : quantity,
    cost: price * quantity,
    average: status !== ORDER_STATUS.NEW ? 
             faker.number.float({ min: price * 0.95, max: price * 1.05 }) : null,
    fee: {
      currency: 'USDT',
      cost: price * quantity * 0.001,
      rate: 0.001
    },
    stopPrice: type.includes('STOP') ? 
               price * (side === ORDER_SIDES.BUY ? 1.01 : 0.99) : null,
    limitPrice: type.includes('LIMIT') ? price : null,
    trailingOffset: type === ORDER_TYPES.TRAILING_STOP ? 
                    faker.number.float({ min: 1, max: 5 }) : null,
    trailingPercent: type === ORDER_TYPES.TRAILING_STOP ? 
                     faker.number.float({ min: 0.1, max: 5 }) : null,
    timeInForce: faker.helpers.arrayElement(['GTC', 'IOC', 'FOK']),
    postOnly: faker.datatype.boolean(),
    hidden: type === ORDER_TYPES.ICEBERG,
    icebergQty: type === ORDER_TYPES.ICEBERG ? 
                quantity / faker.number.int({ min: 2, max: 5 }) : null,
    leverage: 1,
    reduceOnly: faker.datatype.boolean(),
    margin: 0,
    trades: [],
    flags: [],
    clientOrderId: faker.string.alphanumeric(16),
    timestamps: {
      created: faker.date.past(),
      updated: faker.date.recent(),
      lastTrade: status !== ORDER_STATUS.NEW ? faker.date.recent() : null,
      closed: ['filled', 'cancelled', 'rejected', 'expired'].includes(status) ? 
              faker.date.recent() : null
    },
    ...overrides
  };
};

// Çoklu emir oluşturucu
export const createMockOrders = (count = 10, overrides = {}) => {
  return Array.from({ length: count }, () => createMockOrder(overrides));
};

// Emir geçmişi oluşturucu
export const createMockOrderHistory = (userId, count = 100) => {
  const orders = createMockOrders(count, {
    userId,
    status: faker.helpers.arrayElement([
      ORDER_STATUS.FILLED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.REJECTED,
      ORDER_STATUS.EXPIRED
    ])
  });

  return orders.sort((a, b) => 
    a.timestamps.created.getTime() - b.timestamps.created.getTime()
  );
};

// OCO emir oluşturucu
export const createMockOCOOrder = (overrides = {}) => {
  const baseOrder = createMockOrder({ type: ORDER_TYPES.LIMIT });
  const stopOrder = createMockOrder({ 
    type: ORDER_TYPES.STOP_LIMIT,
    price: baseOrder.side === ORDER_SIDES.BUY ? 
           baseOrder.price * 1.02 : baseOrder.price * 0.98
  });

  return {
    id: faker.string.uuid(),
    userId: baseOrder.userId,
    symbol: baseOrder.symbol,
    orders: [baseOrder, stopOrder],
    status: faker.helpers.arrayElement(Object.values(ORDER_STATUS)),
    timestamps: {
      created: faker.date.past(),
      updated: faker.date.recent(),
      triggered: null,
      closed: null
    },
    ...overrides
  };
};

// Emir istatistikleri oluşturucu
export const createMockOrderStats = (userId, overrides = {}) => {
  const totalOrders = faker.number.int({ min: 100, max: 1000 });
  const fillRate = faker.number.float({ min: 0.6, max: 0.9 });
  const filledOrders = Math.floor(totalOrders * fillRate);

  return {
    userId,
    totalOrders,
    filledOrders,
    cancelledOrders: faker.number.int({ min: 10, max: 100 }),
    rejectedOrders: faker.number.int({ min: 0, max: 20 }),
    expiredOrders: faker.number.int({ min: 0, max: 20 }),
    fillRate: fillRate * 100,
    averageExecutionTime: faker.number.float({ min: 0.1, max: 5 }),
    averageSlippage: faker.number.float({ min: 0.01, max: 0.5 }),
    totalVolume: faker.number.float({ min: 10000, max: 1000000 }),
    metadata: {},
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

export { ORDER_TYPES, ORDER_SIDES, ORDER_STATUS }; 