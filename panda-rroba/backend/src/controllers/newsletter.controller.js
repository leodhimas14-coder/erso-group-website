const Subscriber = require('../models/Subscriber');
const { HttpError } = require('../middleware/errorHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function subscribe(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) throw new HttpError(400, 'Shkruani një adresë email të saktë');
  if (req.body?.consent !== true) throw new HttpError(400, 'Duhet të pranoni të merrni njoftime nga Panda.al');

  await Subscriber.updateOne({ email }, { $set: { consent: true, active: true } }, { upsert: true });
  res.status(201).json({ ok: true });
}

async function list(_req, res) {
  const subscribers = await Subscriber.find({ active: true }).sort({ createdAt: -1 }).limit(5000);
  res.json({ subscribers, total: subscribers.length });
}

module.exports = { subscribe, list };
