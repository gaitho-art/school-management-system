import jwt from 'jsonwebtoken';

export function normalizeRole(role) {
  const normalizedRole = (role || '').toString().toLowerCase().replace(/\s+/g, '_');
  const aliases = {
    director: 'principal',
    head_master: 'principal',
    headmaster: 'principal',
    class_teacher: 'teacher',
  };
  return aliases[normalizedRole] || normalizedRole;
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const currentRole = normalizeRole(req.user.role);
    const allowedRoles = roles.map(normalizeRole);
    if (!allowedRoles.includes(currentRole)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    next();
  };
}
