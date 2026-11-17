const { Router } = require('express');
const { requireAdmin } = require('../middleware/auth');
const { adminList } = require('../controllers/newsletterController');

const router = Router();
router.use(requireAdmin);
router.get('/', adminList);

module.exports = router;
