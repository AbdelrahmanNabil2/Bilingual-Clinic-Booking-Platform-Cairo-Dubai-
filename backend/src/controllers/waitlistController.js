const pool = require('../db/pool');
const { sendWaitlistSlotAvailable } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getLocationBySlug(slug) {
  const { rows } = await pool.query('SELECT * FROM locations WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function join(req, res, next) {
  try {
    const { patient_name, email, phone, location, date } = req.body || {};

    const errors = [];
    if (!patient_name || patient_name.trim().length < 2) errors.push('A valid name is required.');
    if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required.');
    if (!location) errors.push('A location is required.');
    if (!date) errors.push('A date is required.');
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const loc = await getLocationBySlug(location);
    if (!loc) return res.status(400).json({ message: 'Unknown location.' });

    const { rows } = await pool.query(
      `INSERT INTO waitlist_entries (location_id, requested_date, patient_name, email, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [loc.id, date, patient_name.trim(), email.trim(), phone || null]
    );
    res.status(201).json({ message: "You're on the waitlist — we'll email you if a slot opens up.", data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Called whenever an appointment is cancelled. If anyone is waiting for
 * that location/date, emails the earliest-joined entry and marks them
 * notified so we don't email them twice for the same opening.
 */
async function notifyNextWaitlistEntry(locationId, date) {
  const { rows } = await pool.query(
    `SELECT * FROM waitlist_entries
     WHERE location_id = $1 AND requested_date = $2 AND notified_at IS NULL
     ORDER BY created_at ASC LIMIT 1`,
    [locationId, date]
  );
  const entry = rows[0];
  if (!entry) return;

  await pool.query('UPDATE waitlist_entries SET notified_at = now() WHERE id = $1', [entry.id]);
  await sendWaitlistSlotAvailable(entry, date);
}

async function adminList(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT w.*, l.slug AS location_slug, l.city_en AS location_city_en
       FROM waitlist_entries w JOIN locations l ON l.id = w.location_id
       ORDER BY w.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { join, notifyNextWaitlistEntry, adminList };
