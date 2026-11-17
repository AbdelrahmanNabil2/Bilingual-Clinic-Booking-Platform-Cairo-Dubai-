const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { join } = require('../controllers/waitlistController');

const router = Router();

const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

router.post('/', joinLimiter, join);

module.exports = router;
