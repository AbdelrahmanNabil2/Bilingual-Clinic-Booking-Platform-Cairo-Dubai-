const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const {
  availability, createAppointment, getByToken, rescheduleByToken, cancelByToken
} = require('../controllers/appointmentsController');

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many booking attempts. Please try again later.' }
});

const manageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

router.get('/availability', availability);
router.post('/', bookingLimiter, createAppointment);
router.get('/manage/:token', manageLimiter, getByToken);
router.put('/manage/:token', manageLimiter, rescheduleByToken);
router.put('/manage/:token/cancel', manageLimiter, cancelByToken);

module.exports = router;
