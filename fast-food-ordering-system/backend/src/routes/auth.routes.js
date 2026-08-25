const express = require('express');
const { login, loginWithPin, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/login-pin', loginWithPin);
router.get('/me', requireAuth, me);

module.exports = router;
