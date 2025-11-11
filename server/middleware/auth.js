import { verifyToken } from '../utils/jwt.js';

// Middleware to attach user from JWT token (Authorization: Bearer <token>)
// Also supports dev headers if ALLOW_DEV_HEADERS=true
export function attachUser(req, res, next) {
  try {
    let token = null;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // In dev, allow x-user-id and x-user-role headers for testing
    if (!token && process.env.ALLOW_DEV_HEADERS === 'true') {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];
      if (userId) {
        req.user = { id: userId, role: userRole || 'user' };
        return next();
      }
    }

    if (!token) return next();

    const payload = verifyToken(token);
    if (!payload) return next();

    req.user = payload;
  } catch (e) {
    // Silently ignore auth errors
  }
  next();
}

// Require authenticated user
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  next();
}

// Require admin role
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
  }
  next();
}

// Require specific role
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'FORBIDDEN', message: `Role '${role}' required` });
    }
    next();
  };
}