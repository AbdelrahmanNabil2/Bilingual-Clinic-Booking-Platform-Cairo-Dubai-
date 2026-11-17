const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const servicesRouter = require('./routes/services');
const doctorsRouter = require('./routes/doctors');
const locationsRouter = require('./routes/locations');
const testimonialsRouter = require('./routes/testimonials');
const contactRouter = require('./routes/contact');
const newsRouter = require('./routes/news');
const appointmentsRouter = require('./routes/appointments');
const waitlistRouter = require('./routes/waitlist');
const reviewsRouter = require('./routes/reviews');
const searchRouter = require('./routes/search');
const newsletterRouter = require('./routes/newsletter');
const uploadRouter = require('./routes/upload');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const adminNewsRouter = require('./routes/adminNews');
const adminAppointmentsRouter = require('./routes/adminAppointments');
const adminWaitlistRouter = require('./routes/adminWaitlist');
const adminNewsletterRouter = require('./routes/adminNewsletter');
const adminUsersRouter = require('./routes/adminUsers');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      // Credentialed requests (cookies for refresh tokens) require an exact
      // origin list — can't use `origin: true` / wildcard once credentials
      // are involved.
      origin: allowedOrigins.length ? allowedOrigins : 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    })
  );

  // Stripe needs the raw, unparsed body to verify webhook signatures, so
  // this route is mounted before the global express.json() below.
  app.use('/api/payments', express.raw({ type: 'application/json' }), paymentsRouter);

  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/services', servicesRouter);
  app.use('/api/doctors', doctorsRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/testimonials', testimonialsRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/waitlist', waitlistRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/newsletter', newsletterRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin/news', adminNewsRouter);
  app.use('/api/admin/appointments', adminAppointmentsRouter);
  app.use('/api/admin/waitlist', adminWaitlistRouter);
  app.use('/api/admin/newsletter', adminNewsletterRouter);
  app.use('/api/admin/admins', adminUsersRouter);
  app.use('/api/admin', adminRouter);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
