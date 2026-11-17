const { Router } = require('express');
const { listController } = require('../controllers/contentController');

const router = Router();

router.get(
  '/',
  listController(
    `SELECT slug, city_en, city_ar, country_en, country_ar, address_en, address_ar,
            phone, email, hours_en, hours_ar, latitude, longitude
     FROM locations
     ORDER BY id ASC`
  )
);

module.exports = router;
