const WordOfDay = require('../models/WordOfDay');
const WordSuggestion = require('../models/WordSuggestion');
const WordComment = require('../models/WordComment');
const { emitWordOfDayUpdated, emitWordSuggestionUpdated } = require('../sockets/index');

async function getActiveWord(req, res, next) {
  try {
    const word = await WordOfDay.findOne({ active: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username displayName');

    if (!word) return res.json({ word: null, suggestions: [] });

    const suggestions = await WordSuggestion.find({ wordOfDay: word._id })
      .sort({ votesCount: -1, createdAt: 1 })
      .populate('submittedBy', 'username displayName');

    return res.json({ word, suggestions });
  } catch (err) {
    return next(err);
  }
}

/** Admin-only: posts a new "Fjala e Ditës" and deactivates the previous round. */
async function setWord(req, res, next) {
  try {
    const { word, note } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word text is required' });
    }
    if (word.length > 60) {
      return res.status(400).json({ error: 'Word must be 60 characters or fewer' });
    }

    await WordOfDay.updateMany({ active: true }, { active: false });

    let created = await WordOfDay.create({
      word: word.trim(),
      note: (note || '').trim(),
      createdBy: req.user.id,
    });
    created = await created.populate('createdBy', 'username displayName');

    emitWordOfDayUpdated(created);
    return res.status(201).json({ word: created });
  } catch (err) {
    return next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const words = await WordOfDay.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('createdBy', 'username displayName');
    return res.json({ words });
  } catch (err) {
    return next(err);
  }
}

async function createSuggestion(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Suggestion text is required' });
    }
    if (text.length > 60) {
      return res.status(400).json({ error: 'Suggestion must be 60 characters or fewer' });
    }

    const word = await WordOfDay.findById(req.params.wordId);
    if (!word) return res.status(404).json({ error: 'Word of the day not found' });

    let suggestion = await WordSuggestion.create({
      wordOfDay: word._id,
      text: text.trim(),
      submittedBy: req.user.id,
    });
    suggestion = await suggestion.populate('submittedBy', 'username displayName');

    emitWordSuggestionUpdated(suggestion);
    return res.status(201).json({ suggestion });
  } catch (err) {
    return next(err);
  }
}

async function toggleVote(req, res, next) {
  try {
    const suggestion = await WordSuggestion.findById(req.params.suggestionId);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    const userId = req.user.id;
    const alreadyVoted = suggestion.votedBy.some((id) => id.toString() === userId);

    if (alreadyVoted) {
      suggestion.votedBy = suggestion.votedBy.filter((id) => id.toString() !== userId);
    } else {
      suggestion.votedBy.push(userId);
    }
    suggestion.votesCount = suggestion.votedBy.length;
    await suggestion.save();

    const populated = await suggestion.populate('submittedBy', 'username displayName');
    emitWordSuggestionUpdated(populated);

    return res.json({ voted: !alreadyVoted, votesCount: suggestion.votesCount });
  } catch (err) {
    return next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const comments = await WordComment.find({ wordOfDay: req.params.wordId })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName');
    return res.json({ comments });
  } catch (err) {
    return next(err);
  }
}

async function createComment(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const word = await WordOfDay.findById(req.params.wordId);
    if (!word) return res.status(404).json({ error: 'Word of the day not found' });

    let comment = await WordComment.create({
      wordOfDay: word._id,
      author: req.user.id,
      text: text.trim(),
    });
    comment = await comment.populate('author', 'username displayName');

    return res.status(201).json({ comment });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getActiveWord,
  setWord,
  listHistory,
  createSuggestion,
  toggleVote,
  listComments,
  createComment,
};
