process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';

const { signAccessToken, signMfaPendingToken, verifyToken } = require('../src/utils/token');
const { generateToken, hashToken } = require('../src/utils/randomToken');

describe('token utils', () => {
  const admin = { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin' };

  test('signAccessToken produces a token verifiable back to the same payload', () => {
    const token = signAccessToken(admin);
    const payload = verifyToken(token);
    expect(payload.sub).toBe(admin.id);
    expect(payload.email).toBe(admin.email);
    expect(payload.role).toBe(admin.role);
    expect(payload.type).toBe('access');
  });

  test('signMfaPendingToken is a distinct type from access tokens', () => {
    const token = signMfaPendingToken(admin);
    const payload = verifyToken(token);
    expect(payload.type).toBe('mfa_pending');
    expect(payload.sub).toBe(admin.id);
  });

  test('verifyToken rejects a tampered token', () => {
    const token = signAccessToken(admin);
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyToken(tampered)).toThrow();
  });
});

describe('randomToken utils', () => {
  test('generateToken produces unique, sufficiently long tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  test('hashToken is deterministic and one-way-looking', () => {
    const raw = generateToken();
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toEqual(raw);
  });
});
