const { Router } = require('express');
const { requireAdmin, requireRole } = require('../middleware/auth');
const { list, create, updateRole, remove } = require('../controllers/adminUsersController');

const router = Router();
router.use(requireAdmin, requireRole('admin'));

router.get('/', list);
router.post('/', create);
router.put('/:id/role', updateRole);
router.delete('/:id', remove);

module.exports = router;
