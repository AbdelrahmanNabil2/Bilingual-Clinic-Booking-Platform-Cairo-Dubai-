const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed.'));
    }
    cb(null, true);
  }
});

const router = Router();
router.use(requireAdmin);

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.status(201).json({ data: { url } });
});

// Multer errors (file too large, wrong type) land here instead of the
// generic error handler so we can give a clearer message.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Upload failed.' });
});

module.exports = router;
