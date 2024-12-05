import { faker } from '@faker-js/faker';

// Kullanıcı rolleri
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// Kullanıcı durumları
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// Temel kullanıcı oluşturucu
export const createMockUser = (overrides = {}) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    username: faker.internet.userName({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    password: faker.internet.password({ length: 12 }),
    firstName,
    lastName,
    avatar: faker.image.avatar(),
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    phone: faker.phone.number(),
    country: faker.location.country(),
    city: faker.location.city(),
    address: faker.location.streetAddress(),
    company: faker.company.name(),
    bio: faker.person.bio(),
    settings: {
      theme: 'light',
      notifications: true,
      language: 'tr',
      timezone: 'Europe/Istanbul'
    },
    metadata: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastLogin: faker.date.recent(),
    ...overrides
  };
};

// Çoklu kullanıcı oluşturucu
export const createMockUsers = (count = 10, overrides = {}) => {
  return Array.from({ length: count }, () => createMockUser(overrides));
};

// Admin kullanıcı oluşturucu
export const createMockAdmin = (overrides = {}) => {
  return createMockUser({
    role: USER_ROLES.ADMIN,
    permissions: ['all'],
    ...overrides
  });
};

// Test kullanıcısı oluşturucu
export const createTestUser = (overrides = {}) => {
  return createMockUser({
    email: 'test@example.com',
    password: 'Test123!',
    role: USER_ROLES.USER,
    ...overrides
  });
};

// Kullanıcı koleksiyonu oluşturucu
export const createMockUserCollection = (count = 10) => {
  const users = createMockUsers(count - 2);
  const admin = createMockAdmin();
  const testUser = createTestUser();

  return [admin, testUser, ...users];
};

// Kullanıcı profili oluşturucu
export const createMockUserProfile = (userId, overrides = {}) => {
  return {
    userId,
    displayName: faker.person.fullName(),
    title: faker.person.jobTitle(),
    bio: faker.person.bio(),
    website: faker.internet.url(),
    social: {
      twitter: faker.internet.userName(),
      linkedin: faker.internet.userName(),
      github: faker.internet.userName()
    },
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false
    },
    stats: {
      followers: faker.number.int({ min: 0, max: 1000 }),
      following: faker.number.int({ min: 0, max: 1000 }),
      posts: faker.number.int({ min: 0, max: 100 })
    },
    metadata: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

export { USER_ROLES, USER_STATUS }; 