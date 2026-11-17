const { Router } = require('express');
const { listPublished, getBySlug } = require('../controllers/newsController');

const router = Router();

router.get('/', listPublished);
router.get('/:slug', getBySlug);

module.exports = router;
