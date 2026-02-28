import { validateRequiredEnv } from './env';

describe('validateRequiredEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws in production when JWT secrets missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.DATABASE_URL;
    expect(() => validateRequiredEnv()).toThrow(/Missing required env/);
  });

  it('does not throw in production when JWT_SECRET and DATABASE_URL are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateRequiredEnv()).not.toThrow();
  });

  it('does not throw in non-production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.DATABASE_URL;
    expect(() => validateRequiredEnv()).not.toThrow();
  });
});
