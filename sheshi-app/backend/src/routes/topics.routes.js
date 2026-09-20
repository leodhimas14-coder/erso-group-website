const express = require('express');
const { getActiveTopic, setTopic, listHistory } = require('../controllers/topics.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/daily', getActiveTopic);
router.post('/daily', requireAuth, requireRole('admin'), setTopic);
router.get('/daily/history', requireAuth, requireRole('admin'), listHistory);

module.exports = router;
