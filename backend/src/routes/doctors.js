const { Router } = require('express');
const { listController } = require('../controllers/contentController');
const pool = require('../db/pool');

const router = Router();

router.get(
  '/',
  listController(
    `SELECT d.id, d.slug, d.name_en, d.name_ar, d.title_en, d.title_ar, d.bio_en, d.bio_ar, d.photo_url,
            l.slug AS location_slug, l.city_en AS location_city_en, l.city_ar AS location_city_ar
     FROM doctors d
     LEFT JOIN locations l ON l.id = d.location_id
     ORDER BY d.sort_order ASC`
  )
);

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.slug, d.name_en, d.name_ar, d.title_en, d.title_ar, d.bio_en, d.bio_ar, d.photo_url,
              l.slug AS location_slug, l.city_en AS location_city_en, l.city_ar AS location_city_ar
       FROM doctors d
       LEFT JOIN locations l ON l.id = d.location_id
       WHERE d.slug = $1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
