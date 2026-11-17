const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES_IN = '15m';
const MFA_PENDING_EXPIRES_IN = '5m';

function signAccessToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, name: admin.name, role: admin.role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function signMfaPendingToken(admin) {
  return jwt.sign(
    { sub: admin.id, type: 'mfa_pending' },
    process.env.JWT_SECRET,
    { expiresIn: MFA_PENDING_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signAccessToken, signMfaPendingToken, verifyToken };
