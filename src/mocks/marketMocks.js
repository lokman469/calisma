import { faker } from '@faker-js/faker';

// Market tipleri
const MARKET_TYPES = {
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures',
  OPTIONS: 'options'
};

// Para birimleri
const CURRENCIES = {
  FIAT: ['USD', 'EUR', 'TRY', 'GBP', 'JPY'],
  CRYPTO: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA']
};

// Market durumları
const MARKET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  MAINTENANCE: 'maintenance'
};

// Temel market verisi oluşturucu
export const createMockMarket = (overrides = {}) => {
  const baseCurrency = faker.helpers.arrayElement(CURRENCIES.CRYPTO);
  const quoteCurrency = faker.helpers.arrayElement(CURRENCIES.FIAT);
  const symbol = `${baseCurrency}/${quoteCurrency}`;
  const price = faker.number.float({ min: 0.1, max: 100000, precision: 0.01 });

  return {
    id: faker.string.uuid(),
    symbol,
    name: `${baseCurrency} ${quoteCurrency}`,
    type: MARKET_TYPES.SPOT,
    status: MARKET_STATUS.ACTIVE,
    baseCurrency,
    quoteCurrency,
    price,
    priceChange: faker.number.float({ min: -10, max: 10, precision: 0.01 }),
    volume: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }),
    high24h: price * (1 + faker.number.float({ min: 0, max: 0.1 })),
    low24h: price * (1 - faker.number.float({ min: 0, max: 0.1 })),
    marketCap: faker.number.float({ min: 1000000, max: 1000000000 }),
    supply: {
      total: faker.number.float({ min: 1000000, max: 1000000000 }),
      circulating: faker.number.float({ min: 100000, max: 1000000 }),
      max: faker.number.float({ min: 1000000, max: 1000000000 })
    },
    limits: {
      minQuantity: faker.number.float({ min: 0.0001, max: 0.1 }),
      maxQuantity: faker.number.float({ min: 100, max: 1000 }),
      minPrice: faker.number.float({ min: 0.0001, max: 0.1 }),
      maxPrice: faker.number.float({ min: 100000, max: 1000000 }),
      minNotional: faker.number.float({ min: 1, max: 10 })
    },
    fees: {
      maker: faker.number.float({ min: 0.0001, max: 0.001 }),
      taker: faker.number.float({ min: 0.0001, max: 0.001 })
    },
    precision: {
      price: faker.number.int({ min: 2, max: 8 }),
      quantity: faker.number.int({ min: 2, max: 8 })
    },
    metadata: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

// Çoklu market oluşturucu
export const createMockMarkets = (count = 10, overrides = {}) => {
  return Array.from({ length: count }, () => createMockMarket(overrides));
};

// Market mum verisi oluşturucu
export const createMockCandle = (basePrice = 100, overrides = {}) => {
  const changePercent = faker.number.float({ min: -0.05, max: 0.05 });
  const open = basePrice;
  const close = basePrice * (1 + changePercent);
  const high = Math.max(open, close) * (1 + faker.number.float({ min: 0, max: 0.02 }));
  const low = Math.min(open, close) * (1 - faker.number.float({ min: 0, max: 0.02 }));

  return {
    timestamp: faker.date.recent(),
    open,
    high,
    low,
    close,
    volume: faker.number.float({ min: 100, max: 10000 }),
    trades: faker.number.int({ min: 10, max: 1000 }),
    ...overrides
  };
};

// Market mum verileri oluşturucu
export const createMockCandles = (count = 100, options = {}) => {
  const {
    basePrice = 100,
    volatility = 0.05,
    trend = 0,
    interval = '1h'
  } = options;

  let currentPrice = basePrice;
  const candles = [];

  for (let i = 0; i < count; i++) {
    const trendChange = trend * (i / count);
    const randomChange = faker.number.float({ min: -volatility, max: volatility });
    const totalChange = trendChange + randomChange;
    
    currentPrice = currentPrice * (1 + totalChange);
    
    const candle = createMockCandle(currentPrice, {
      timestamp: faker.date.recent(count - i, new Date())
    });
    
    candles.push(candle);
  }

  return candles.sort((a, b) => a.timestamp - b.timestamp);
};

// Market derinlik verisi oluşturucu
export const createMockOrderBook = (basePrice = 100, depth = 20, overrides = {}) => {
  const bids = [];
  const asks = [];

  for (let i = 0; i < depth; i++) {
    const bidPrice = basePrice * (1 - faker.number.float({ min: 0, max: 0.1 }));
    const askPrice = basePrice * (1 + faker.number.float({ min: 0, max: 0.1 }));
    
    bids.push([
      bidPrice,
      faker.number.float({ min: 0.1, max: 10 })
    ]);
    
    asks.push([
      askPrice,
      faker.number.float({ min: 0.1, max: 10 })
    ]);
  }

  return {
    bids: bids.sort((a, b) => b[0] - a[0]),
    asks: asks.sort((a, b) => a[0] - b[0]),
    timestamp: faker.date.recent(),
    ...overrides
  };
};

export { MARKET_TYPES, CURRENCIES, MARKET_STATUS }; 