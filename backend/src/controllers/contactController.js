const pool = require('../db/pool');
const { sendContactNotification } = require('../utils/mailer');

const VALID_LOCATIONS = new Set(['cairo', 'dubai', 'either']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body) {
  const errors = [];
  const { name, email, message } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('A valid name is required.');
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    errors.push('A message is required.');
  }
  if (body.location && !VALID_LOCATIONS.has(body.location)) {
    errors.push('Invalid location value.');
  }

  return errors;
}

async function createContactSubmission(req, res, next) {
  try {
    const errors = validate(req.body || {});
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const { name, email, phone, location, message } = req.body;
    const preferredLocation = location || 'either';

    const { rows } = await pool.query(
      `INSERT INTO contact_submissions (name, email, phone, preferred_location, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [name.trim(), email.trim(), phone ? phone.trim() : null, preferredLocation, message.trim()]
    );

    // Email delivery is best-effort — the submission is already saved,
    // so a failed email should never fail the request.
    sendContactNotification({ name, email, phone, preferredLocation, message }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to send contact notification email:', err.message);
    });

    res.status(201).json({ message: 'Submission received.', id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

module.exports = { createContactSubmission };
