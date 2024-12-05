import { faker } from '@faker-js/faker';

// Webhook tipleri
const WEBHOOK_TYPES = {
  PRICE_ALERT: 'price_alert',
  TRADE: 'trade',
  ORDER: 'order',
  POSITION: 'position',
  BALANCE: 'balance',
  SYSTEM: 'system',
  CUSTOM: 'custom'
};

// Webhook durumları
const WEBHOOK_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRIGGERED: 'triggered',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Tetikleyici tipleri
const TRIGGER_TYPES = {
  ABOVE: 'above',
  BELOW: 'below',
  CROSSES: 'crosses',
  PERCENT_CHANGE: 'percent_change',
  VALUE_CHANGE: 'value_change',
  TIME: 'time',
  EVENT: 'event'
};

// Delivery metodları
const DELIVERY_METHODS = {
  HTTP: 'http',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
  EMAIL: 'email',
  SMS: 'sms'
};

// Temel webhook oluşturucu
export const createMockWebhook = (overrides = {}) => {
  const type = faker.helpers.arrayElement(Object.values(WEBHOOK_TYPES));
  const status = faker.helpers.arrayElement(Object.values(WEBHOOK_STATUS));
  const triggerType = faker.helpers.arrayElement(Object.values(TRIGGER_TYPES));
  const deliveryMethod = faker.helpers.arrayElement(Object.values(DELIVERY_METHODS));

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.word.words(2),
    description: faker.lorem.sentence(),
    type,
    status,
    trigger: {
      type: triggerType,
      conditions: createMockTriggerConditions(triggerType),
      symbol: type === WEBHOOK_TYPES.PRICE_ALERT ? 'BTC/USDT' : null
    },
    delivery: {
      method: deliveryMethod,
      target: createMockDeliveryTarget(deliveryMethod),
      format: 'json',
      headers: deliveryMethod === DELIVERY_METHODS.HTTP ? {
        'Authorization': `Bearer ${faker.string.alphanumeric(32)}`,
        'Content-Type': 'application/json'
      } : null
    },
    retryPolicy: {
      maxRetries: faker.number.int({ min: 1, max: 5 }),
      retryInterval: faker.number.int({ min: 60, max: 300 }),
      backoffMultiplier: faker.number.float({ min: 1.5, max: 2.5 })
    },
    rateLimit: {
      maxRequests: faker.number.int({ min: 10, max: 100 }),
      timeWindow: faker.number.int({ min: 60, max: 3600 })
    },
    security: {
      signatureKey: faker.string.alphanumeric(32),
      signatureHeader: 'X-Signature',
      ipWhitelist: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, 
        () => faker.internet.ip())
    },
    stats: {
      triggered: faker.number.int({ min: 0, max: 100 }),
      successful: faker.number.int({ min: 0, max: 100 }),
      failed: faker.number.int({ min: 0, max: 20 }),
      lastTrigger: status === WEBHOOK_STATUS.TRIGGERED ? faker.date.recent() : null,
      lastSuccess: status === WEBHOOK_STATUS.TRIGGERED ? faker.date.recent() : null,
      lastFailure: status === WEBHOOK_STATUS.FAILED ? faker.date.recent() : null
    },
    metadata: {},
    timestamps: {
      created: faker.date.past(),
      updated: faker.date.recent(),
      expires: faker.date.future()
    },
    ...overrides
  };
};

// Tetikleyici koşulları oluşturucu
const createMockTriggerConditions = (triggerType) => {
  switch (triggerType) {
    case TRIGGER_TYPES.ABOVE:
    case TRIGGER_TYPES.BELOW:
      return {
        price: faker.number.float({ min: 100, max: 50000 }),
        duration: faker.number.int({ min: 60, max: 3600 })
      };
    
    case TRIGGER_TYPES.CROSSES:
      return {
        value: faker.number.float({ min: 100, max: 50000 }),
        direction: faker.helpers.arrayElement(['up', 'down'])
      };
    
    case TRIGGER_TYPES.PERCENT_CHANGE:
      return {
        percent: faker.number.float({ min: 1, max: 10 }),
        timeframe: faker.number.int({ min: 300, max: 86400 })
      };
    
    case TRIGGER_TYPES.VALUE_CHANGE:
      return {
        amount: faker.number.float({ min: 100, max: 1000 }),
        timeframe: faker.number.int({ min: 300, max: 86400 })
      };
    
    case TRIGGER_TYPES.TIME:
      return {
        schedule: faker.helpers.arrayElement(['*/15 * * * *', '0 */1 * * *', '0 0 * * *']),
        timezone: 'UTC'
      };
    
    case TRIGGER_TYPES.EVENT:
      return {
        event: faker.helpers.arrayElement(['trade', 'order', 'deposit', 'withdrawal']),
        conditions: {
          amount: faker.number.float({ min: 100, max: 10000 }),
          type: faker.helpers.arrayElement(['market', 'limit'])
        }
      };
    
    default:
      return {};
  }
};

// Delivery hedefi oluşturucu
const createMockDeliveryTarget = (method) => {
  switch (method) {
    case DELIVERY_METHODS.HTTP:
      return faker.internet.url();
    
    case DELIVERY_METHODS.TELEGRAM:
      return {
        chatId: faker.string.numeric(10),
        botToken: faker.string.alphanumeric(45)
      };
    
    case DELIVERY_METHODS.DISCORD:
      return {
        webhookUrl: faker.internet.url(),
        channelId: faker.string.numeric(18)
      };
    
    case DELIVERY_METHODS.EMAIL:
      return faker.internet.email();
    
    case DELIVERY_METHODS.SMS:
      return faker.phone.number();
    
    default:
      return null;
  }
};

// Çoklu webhook oluşturucu
export const createMockWebhooks = (count = 10, overrides = {}) => {
  return Array.from({ length: count }, () => createMockWebhook(overrides));
};

// Webhook geçmişi oluşturucu
export const createMockWebhookHistory = (webhookId, count = 50) => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    webhookId,
    timestamp: faker.date.recent(),
    success: faker.datatype.boolean(),
    statusCode: faker.helpers.arrayElement([200, 201, 400, 401, 404, 500]),
    requestDuration: faker.number.float({ min: 100, max: 2000 }),
    request: {
      method: 'POST',
      url: faker.internet.url(),
      headers: {},
      body: {}
    },
    response: {
      headers: {},
      body: {}
    },
    error: null
  }));
};

export { WEBHOOK_TYPES, WEBHOOK_STATUS, TRIGGER_TYPES, DELIVERY_METHODS }; 