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
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateRequiredEnv()).toThrow(/Missing required env/);
  });

  it('does not throw in non-production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateRequiredEnv()).not.toThrow();
  });
});
