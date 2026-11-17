const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { submit } = require('../controllers/reviewsController');

const router = Router();

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' }
});

router.post('/', reviewLimiter, submit);

module.exports = router;
