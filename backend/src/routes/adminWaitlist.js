const { Router } = require('express');
const { requireAdmin } = require('../middleware/auth');
const { adminList } = require('../controllers/waitlistController');

const router = Router();
router.use(requireAdmin);
router.get('/', adminList);

module.exports = router;
