const pool = require('../db/pool');

// Public review submission — always lands unpublished so an admin can
// moderate before it appears on the site.
async function submit(req, res, next) {
  try {
    const { patient_name, quote_en, quote_ar, location_id, rating } = req.body || {};

    if (!patient_name || !quote_en || !quote_ar) {
      return res.status(400).json({ message: 'Name and a quote in both languages are required.' });
    }
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO testimonials (quote_en, quote_ar, patient_name, location_id, rating, is_published)
       VALUES ($1,$2,$3,$4,$5, false)
       RETURNING id`,
      [quote_en.trim(), quote_ar.trim(), patient_name.trim(), location_id || null, rating || null]
    );
    res.status(201).json({ message: 'Thank you — your review will appear once approved.', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit };
