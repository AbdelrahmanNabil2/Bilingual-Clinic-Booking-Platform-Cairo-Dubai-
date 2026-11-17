const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const {
  login, verify2fa, refresh, logout, me,
  forgotPassword, resetPassword,
  setup2fa, enable2fa, disable2fa
} = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

router.post('/login', loginLimiter, login);
router.post('/2fa/verify', loginLimiter, verify2fa);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAdmin, me);

router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);

router.post('/2fa/setup', requireAdmin, setup2fa);
router.post('/2fa/enable', requireAdmin, enable2fa);
router.post('/2fa/disable', requireAdmin, disable2fa);

module.exports = router;
