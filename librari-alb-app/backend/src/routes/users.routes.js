const express = require('express');
const { getProfile, toggleFollow } = require('../controllers/users.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:username', optionalAuth, getProfile);
router.post('/:username/follow', requireAuth, toggleFollow);

module.exports = router;
