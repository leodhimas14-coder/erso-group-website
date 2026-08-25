/**
 * Role-based access control. Usage: router.get('/x', requireAuth, requireRole('admin'))
 * Must run after requireAuth so req.user is populated.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    return next();
  };
}

module.exports = { requireRole };
