const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { createContactSubmission } = require('../controllers/contactController');

const router = Router();

// Limit contact form abuse: 10 submissions per 15 minutes per IP.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this address. Please try again later.' }
});

router.post('/', contactLimiter, createContactSubmission);

module.exports = router;
