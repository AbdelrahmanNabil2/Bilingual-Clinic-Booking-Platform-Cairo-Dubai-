const { Router } = require('express');
const { webhook } = require('../controllers/paymentsController');

const router = Router();

// NOTE: this route must receive the raw request body (not JSON-parsed) for
// Stripe's signature verification to work — see app.js, which mounts this
// route with express.raw() BEFORE the global express.json() middleware.
router.post('/webhook', webhook);

module.exports = router;
