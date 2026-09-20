const DailyTopic = require('../models/DailyTopic');
const { emitTopicUpdated } = require('../sockets/index');

async function getActiveTopic(req, res, next) {
  try {
    const topic = await DailyTopic.findOne({ active: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username displayName');
    return res.json({ topic: topic || null });
  } catch (err) {
    return next(err);
  }
}

/** Admin-only "ping": sets a new topic of the day and deactivates the previous one. */
async function setTopic(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Topic text is required' });
    }
    if (text.length > 200) {
      return res.status(400).json({ error: 'Topic text must be 200 characters or fewer' });
    }

    await DailyTopic.updateMany({ active: true }, { active: false });

    let topic = await DailyTopic.create({ text: text.trim(), createdBy: req.user.id });
    topic = await topic.populate('createdBy', 'username displayName');

    emitTopicUpdated(topic);
    return res.status(201).json({ topic });
  } catch (err) {
    return next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const topics = await DailyTopic.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('createdBy', 'username displayName');
    return res.json({ topics });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getActiveTopic, setTopic, listHistory };
