/**
 * Environment validation tests.
 */

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('does not throw in development mode without vars', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGINS;

    const validateEnv = require('../config/validateEnv');
    // Should not throw
    expect(() => validateEnv()).not.toThrow();
  });

  test('exits in production mode without JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.CORS_ORIGINS;

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const validateEnv = require('../config/validateEnv');
    expect(() => validateEnv()).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });

  test('passes in production with all required vars', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-secure-production-secret-key';
    process.env.DATABASE_URL = 'postgres://localhost:5432/yantrasetu';
    process.env.CORS_ORIGINS = 'https://yantrasetu.vercel.app';

    const validateEnv = require('../config/validateEnv');
    expect(() => validateEnv()).not.toThrow();
  });
});
