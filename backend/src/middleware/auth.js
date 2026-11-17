const { verifyToken } = require('../utils/token');

const ROLE_RANK = { staff: 1, manager: 2, admin: 3 };

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') throw new Error('Wrong token type.');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

/** Use after requireAdmin. Rejects if the admin's role is below minRole. */
function requireRole(minRole) {
  return (req, res, next) => {
    const rank = ROLE_RANK[req.admin?.role] || 0;
    if (rank < ROLE_RANK[minRole]) {
      return res.status(403).json({ message: `This action requires the '${minRole}' role or higher.` });
    }
    next();
  };
}

module.exports = { requireAdmin, requireRole };
