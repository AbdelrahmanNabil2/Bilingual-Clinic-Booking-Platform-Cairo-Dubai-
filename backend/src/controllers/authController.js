const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signAccessToken, signMfaPendingToken, verifyToken } = require('../utils/token');
const { generateToken, hashToken } = require('../utils/randomToken');
const { generateSecret, verifyCode, generateQrCodeDataUrl } = require('../utils/twofa');
const { sendPasswordResetEmail } = require('../utils/mailer');

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_MAX_AGE_MS
  };
}

async function issueRefreshToken(adminId) {
  const token = generateToken();
  await pool.query(
    'INSERT INTO refresh_tokens (admin_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [adminId, hashToken(token), new Date(Date.now() + REFRESH_MAX_AGE_MS)]
  );
  return token;
}

async function issueSession(res, admin) {
  const accessToken = signAccessToken(admin);
  const refreshToken = await issueRefreshToken(admin.id);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

// ── Login (branches into 2FA if enabled) ──────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const admin = rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (admin.totp_enabled) {
      return res.json({ requires2fa: true, pendingToken: signMfaPendingToken(admin) });
    }

    const accessToken = await issueSession(res, admin);
    res.json({ accessToken, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (err) {
    next(err);
  }
}

async function verify2fa(req, res, next) {
  try {
    const { pendingToken, code } = req.body || {};
    if (!pendingToken || !code) return res.status(400).json({ message: 'Code is required.' });

    let payload;
    try {
      payload = verifyToken(pendingToken);
      if (payload.type !== 'mfa_pending') throw new Error('wrong type');
    } catch {
      return res.status(401).json({ message: 'Your session expired — please log in again.' });
    }

    const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [payload.sub]);
    const admin = rows[0];
    if (!admin || !admin.totp_enabled || !verifyCode(code, admin.totp_secret)) {
      return res.status(401).json({ message: 'Invalid code.' });
    }

    const accessToken = await issueSession(res, admin);
    res.json({ accessToken, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (err) {
    next(err);
  }
}

// ── Refresh / logout ──────────────────────────────────────────────────────

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ message: 'No session to refresh.' });

    const tokenHash = hashToken(token);
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );
    const stored = rows[0];
    if (!stored) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // Rotate: revoke the old refresh token, issue a fresh one.
    await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [stored.id]);

    const { rows: adminRows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [stored.admin_id]);
    const admin = adminRows[0];
    if (!admin) return res.status(401).json({ message: 'Account no longer exists.' });

    const accessToken = await issueSession(res, admin);
    res.json({ accessToken, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [hashToken(token)]);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ admin: { id: req.admin.sub, email: req.admin.email, name: req.admin.name, role: req.admin.role } });
}

// ── Password reset ─────────────────────────────────────────────────────

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const generic = { message: 'If that email has an account, a reset link has been sent.' };
    if (!email) return res.json(generic);

    const { rows } = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email.trim().toLowerCase()]);
    const admin = rows[0];
    if (admin) {
      const token = generateToken();
      await pool.query(
        'UPDATE admin_users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [hashToken(token), new Date(Date.now() + 60 * 60 * 1000), admin.id]
      );
      const base = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0];
      sendPasswordResetEmail(admin, `${base}/admin/reset-password/${token}`)
        .catch((e) => console.error('Password reset email failed:', e.message));
    }
    res.json(generic);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: 'A valid token and an 8+ character password are required.' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM admin_users
       WHERE password_reset_token = $1 AND password_reset_expires > now()`,
      [hashToken(token)]
    );
    const admin = rows[0];
    if (!admin) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE admin_users
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $2`,
      [passwordHash, admin.id]
    );
    // Revoke all existing sessions on password change.
    await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE admin_id = $1 AND revoked_at IS NULL', [admin.id]);

    res.json({ message: 'Password updated. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

// ── 2FA setup ───────────────────────────────────────────────────────────

async function setup2fa(req, res, next) {
  try {
    const secret = generateSecret();
    await pool.query('UPDATE admin_users SET totp_secret = $1 WHERE id = $2', [secret, req.admin.sub]);
    const qrCodeDataUrl = await generateQrCodeDataUrl(req.admin.email, secret);
    res.json({ data: { secret, qrCodeDataUrl } });
  } catch (err) {
    next(err);
  }
}

async function enable2fa(req, res, next) {
  try {
    const { code } = req.body || {};
    const { rows } = await pool.query('SELECT totp_secret FROM admin_users WHERE id = $1', [req.admin.sub]);
    const secret = rows[0]?.totp_secret;
    if (!secret || !verifyCode(code, secret)) {
      return res.status(400).json({ message: 'Invalid code.' });
    }
    await pool.query('UPDATE admin_users SET totp_enabled = true WHERE id = $1', [req.admin.sub]);
    res.json({ message: 'Two-factor authentication enabled.' });
  } catch (err) {
    next(err);
  }
}

async function disable2fa(req, res, next) {
  try {
    const { code } = req.body || {};
    const { rows } = await pool.query('SELECT totp_secret FROM admin_users WHERE id = $1', [req.admin.sub]);
    const secret = rows[0]?.totp_secret;
    if (!secret || !verifyCode(code, secret)) {
      return res.status(400).json({ message: 'Invalid code.' });
    }
    await pool.query(
      'UPDATE admin_users SET totp_enabled = false, totp_secret = NULL WHERE id = $1',
      [req.admin.sub]
    );
    res.json({ message: 'Two-factor authentication disabled.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login, verify2fa, refresh, logout, me,
  forgotPassword, resetPassword,
  setup2fa, enable2fa, disable2fa
};
