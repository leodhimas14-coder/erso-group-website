const jwt = require('jsonwebtoken');

// Two kinds of login share the secret but never each other's routes:
//   type 'staff'    → admin panel (User)
//   type 'customer' → shoppers (Customer)

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function verify(req, type) {
  const token = readToken(req);
  if (!token) return { status: 401, error: 'Duhet të identifikoheni' };
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { status: 401, error: 'Sesioni ka skaduar, identifikohuni përsëri' };
  }
  if (payload.type !== type) return { status: 401, error: 'Duhet të identifikoheni' };
  return { payload };
}

/** Admin panel: attaches { id, role, name } to req.user. */
function requireAuth(req, res, next) {
  const { payload, status, error } = verify(req, 'staff');
  if (!payload) return res.status(status).json({ error });
  req.user = payload;
  return next();
}

/** Shopper account: attaches { id, name } to req.customer. */
function requireCustomer(req, res, next) {
  const { payload, status, error } = verify(req, 'customer');
  if (!payload) return res.status(status).json({ error: status === 401 && error === 'Duhet të identifikoheni' ? 'Hyr në llogari ose krijo një llogari për të blerë' : error });
  req.customer = payload;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nuk keni leje për këtë veprim' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireCustomer, requireRole };
