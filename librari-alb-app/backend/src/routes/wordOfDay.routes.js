const express = require('express');
const {
  getActiveWord,
  setWord,
  listHistory,
  createSuggestion,
  toggleVote,
  listComments,
  createComment,
} = require('../controllers/wordOfDay.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/active', getActiveWord);
router.post('/', requireAuth, requireRole('admin'), setWord);
router.get('/history', requireAuth, requireRole('admin'), listHistory);

router.post('/:wordId/suggestions', requireAuth, createSuggestion);
router.post('/suggestions/:suggestionId/vote', requireAuth, toggleVote);

router.get('/:wordId/comments', listComments);
router.post('/:wordId/comments', requireAuth, createComment);

module.exports = router;
