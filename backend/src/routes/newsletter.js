const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { subscribe } = require('../controllers/newsletterController');

const router = Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

router.post('/', subscribeLimiter, subscribe);

module.exports = router;
