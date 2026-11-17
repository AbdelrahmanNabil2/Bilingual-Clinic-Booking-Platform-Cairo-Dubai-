const { authenticator } = require('otplib');
const QRCode = require('qrcode');

function generateSecret() {
  return authenticator.generateSecret();
}

function verifyCode(code, secret) {
  try {
    return authenticator.verify({ token: String(code), secret });
  } catch {
    return false;
  }
}

async function generateQrCodeDataUrl(email, secret) {
  const otpauth = authenticator.keyuri(email, 'Clinic Admin', secret);
  return QRCode.toDataURL(otpauth);
}

module.exports = { generateSecret, verifyCode, generateQrCodeDataUrl };
