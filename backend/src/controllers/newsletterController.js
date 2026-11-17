const pool = require('../db/pool');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function subscribe(req, res, next) {
  try {
    const { email, locale } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'A valid email is required.' });
    }

    await pool.query(
      `INSERT INTO newsletter_subscribers (email, locale)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email.trim().toLowerCase(), locale === 'ar' ? 'ar' : 'en']
    );
    res.status(201).json({ message: 'Subscribed.' });
  } catch (err) {
    next(err);
  }
}

async function adminList(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe, adminList };
