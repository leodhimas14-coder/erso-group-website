const express = require('express');
const { listFeed, createPost, getPost, toggleLike, createReply } = require('../controllers/posts.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', listFeed);
router.post('/', requireAuth, createPost);
router.get('/:id', getPost);
router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/replies', requireAuth, createReply);

module.exports = router;
