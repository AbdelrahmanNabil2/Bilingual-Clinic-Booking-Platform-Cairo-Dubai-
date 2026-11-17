const { Router } = require('express');
const { listController } = require('../controllers/contentController');

const router = Router();

router.get(
  '/',
  listController('SELECT id, title_en, title_ar, description_en, description_ar, icon FROM services ORDER BY sort_order ASC')
);

module.exports = router;
