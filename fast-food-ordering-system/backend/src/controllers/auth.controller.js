const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    return res.json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
}

/** Fast staff login for kiosk/kitchen/cashier terminals using a short PIN instead of email+password. */
async function loginWithPin(req, res, next) {
  try {
    const { userId, pin } = req.body;
    const user = await User.findById(userId).select('+pin');
    if (!user || !user.active || user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    return res.json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, loginWithPin, me };
