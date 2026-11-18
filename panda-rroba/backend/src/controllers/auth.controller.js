const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('../middleware/errorHandler');

async function login(req, res) {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const password = String(req.body?.password || '');

  const user = await User.findOne({ email, active: true });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Email ose fjalëkalim i gabuar');

  const token = jwt.sign(
    { type: 'staff', id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user || !user.active) throw new HttpError(401, 'Llogaria nuk ekziston');
  res.json({ user });
}

module.exports = { login, me };
