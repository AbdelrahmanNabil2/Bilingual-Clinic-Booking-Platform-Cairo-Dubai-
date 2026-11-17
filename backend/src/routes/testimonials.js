const { Router } = require('express');
const { listController } = require('../controllers/contentController');

const router = Router();

router.get(
  '/',
  listController(
    `SELECT t.id, t.quote_en, t.quote_ar, t.patient_name, t.rating, l.slug AS location_slug
     FROM testimonials t
     LEFT JOIN locations l ON l.id = t.location_id
     WHERE t.is_published = true
     ORDER BY t.created_at DESC`
  )
);

module.exports = router;
