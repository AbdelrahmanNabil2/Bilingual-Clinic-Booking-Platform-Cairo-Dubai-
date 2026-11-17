const { Router } = require('express');
const { requireAdmin } = require('../middleware/auth');
const { adminList, adminUpdateStatus } = require('../controllers/appointmentsController');

const router = Router();
router.use(requireAdmin);

router.get('/', adminList);
router.put('/:id/status', adminUpdateStatus);

module.exports = router;
