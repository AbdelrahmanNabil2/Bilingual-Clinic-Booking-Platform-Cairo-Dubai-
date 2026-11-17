const { Router } = require('express');
const { requireAdmin } = require('../middleware/auth');
const {
  adminList, adminGet, adminCreate, adminUpdate, adminRemove
} = require('../controllers/newsController');

const router = Router();
router.use(requireAdmin);

router.get('/', adminList);
router.get('/:id', adminGet);
router.post('/', adminCreate);
router.put('/:id', adminUpdate);
router.delete('/:id', adminRemove);

module.exports = router;
