/**
 * Auth middleware unit tests.
 * Tests JWT generation, verification, sanitization, and spam detection.
 */

// ─── Mock Sequelize models ─────────────────────────────
jest.mock('../models', () => ({
  User: { findByPk: jest.fn() },
  MachineryListing: { findOne: jest.fn() },
  FraudReport: { count: jest.fn() },
}));
jest.mock('../config/database', () => ({
  sequelize: { getDialect: () => 'postgres' },
}));
jest.mock('../config/dbHelpers', () => ({
  iLikeFilter: (val) => val,
}));

describe('Auth Middleware', () => {
  let auth;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-jest';
    auth = require('../middleware/auth');
  });

  test('generateToken returns a valid JWT string', () => {
    const token = auth.generateToken('user-123');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  test('generateRefreshToken returns a different token', () => {
    const access = auth.generateToken('user-123');
    const refresh = auth.generateRefreshToken('user-123');
    expect(access).not.toBe(refresh);
  });

  test('verifyToken decodes a valid token', () => {
    const token = auth.generateToken('user-456');
    const decoded = auth.verifyToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded.userId).toBe('user-456');
    expect(decoded.type).toBe('access');
  });

  test('verifyToken returns null for invalid token', () => {
    const result = auth.verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  test('verifyRefreshToken decodes a refresh token', () => {
    const token = auth.generateRefreshToken('user-789');
    const decoded = auth.verifyRefreshToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded.userId).toBe('user-789');
    expect(decoded.type).toBe('refresh');
  });

  test('verifyToken rejects a refresh token', () => {
    const refreshToken = auth.generateRefreshToken('user-123');
    const decoded = auth.verifyToken(refreshToken);
    // Refresh tokens use a different secret, so this should fail
    expect(decoded).toBeNull();
  });
});

describe('Input Sanitizer', () => {
  const { stripHtml, sanitizeObject, FIELD_LIMITS } = require('../middleware/inputSanitizer');

  test('stripHtml removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(stripHtml(input)).toBe('Hello  World');
  });

  test('stripHtml removes all HTML tags', () => {
    const input = '<b>Bold</b> and <a href="#">link</a>';
    expect(stripHtml(input)).toBe('Bold and link');
  });

  test('stripHtml removes javascript: URIs', () => {
    const input = 'javascript:alert(1)';
    expect(stripHtml(input)).toBe('alert(1)');
  });

  test('stripHtml removes event handlers', () => {
    const input = 'onload=alert(1) onclick=alert(2)';
    expect(stripHtml(input)).toBe('alert(1) alert(2)');
  });

  test('stripHtml returns non-string inputs unchanged', () => {
    expect(stripHtml(42)).toBe(42);
    expect(stripHtml(null)).toBe(null);
  });

  test('sanitizeObject recursively sanitizes nested objects', () => {
    const input = {
      name: '<script>xss</script>John',
      nested: { desc: '<b>Bold</b>' },
    };
    const result = sanitizeObject(input);
    expect(result.name).toBe('John');
    expect(result.nested.desc).toBe('Bold');
  });

  test('sanitizeObject enforces field length limits', () => {
    const input = { firstName: 'A'.repeat(200) };
    const result = sanitizeObject(input);
    expect(result.firstName.length).toBe(FIELD_LIMITS.firstName);
  });

  test('sanitizeObject handles arrays', () => {
    const input = ['<b>one</b>', '<i>two</i>'];
    const result = sanitizeObject(input);
    expect(result).toEqual(['one', 'two']);
  });

  test('sanitizeObject stops at depth limit', () => {
    let deep = { a: 'ok' };
    for (let i = 0; i < 10; i++) deep = { nested: deep };
    // Should not throw
    expect(() => sanitizeObject(deep)).not.toThrow();
  });
});

describe('Spam Detector', () => {
  const { analyzeContent } = require('../middleware/spamDetector');

  test('returns not spam for normal content', () => {
    const result = analyzeContent('This is a great excavator in excellent condition with low hours.');
    expect(result.isSpam).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  test('flags excessive capital letters', () => {
    const result = analyzeContent('THIS IS ALL CAPS AND VERY LONG TEXT THAT SHOULD BE FLAGGED BY THE SYSTEM');
    expect(result.reasons.some(r => r.includes('capital'))).toBe(true);
  });

  test('flags very short content', () => {
    const result = analyzeContent('ok');
    expect(result.reasons.some(r => r.includes('short'))).toBe(true);
  });

  test('flags multiple URLs', () => {
    const result = analyzeContent('Visit https://spam.com and https://more-spam.com for deals');
    expect(result.reasons.some(r => r.includes('URL'))).toBe(true);
  });

  test('handles null/undefined input', () => {
    expect(analyzeContent(null).isSpam).toBe(false);
    expect(analyzeContent(undefined).isSpam).toBe(false);
    expect(analyzeContent('').isSpam).toBe(false);
  });
});
