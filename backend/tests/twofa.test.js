const { authenticator } = require('otplib');
const { generateSecret, verifyCode } = require('../src/utils/twofa');

describe('twofa utils', () => {
  test('a code generated from the secret verifies successfully', () => {
    const secret = generateSecret();
    const code = authenticator.generate(secret);
    expect(verifyCode(code, secret)).toBe(true);
  });

  test('an incorrect code is rejected', () => {
    const secret = generateSecret();
    expect(verifyCode('000000', secret)).toBe(false);
  });

  test('verifyCode never throws, even with garbage input', () => {
    expect(() => verifyCode('not-a-code', 'not-a-secret')).not.toThrow();
    expect(verifyCode('not-a-code', 'not-a-secret')).toBe(false);
  });
});
