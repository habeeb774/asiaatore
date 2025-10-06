// Simple auth/role middleware (placeholder until real auth implemented)
// Extracts userId and role from headers (x-user-id, x-user-role) or defaults.

import { verifyToken } from '../utils/jwt.js';

export function attachUser(req, _res, next) {
  // Priority: Authorization Bearer token
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = { id: payload.id, role: payload.role || 'user', email: payload.email };
      return next();
    }
  }
  // Support token via query string for GET requests (restricted):
  // - Only for invoice endpoints
  // - Enabled by ALLOW_QUERY_TOKEN=true or any non-production NODE_ENV
  if (req.method === 'GET' && req.query && req.query.token) {
    const allowQueryToken = process.env.ALLOW_QUERY_TOKEN === 'true' || process.env.NODE_ENV !== 'production';
    const p = req.originalUrl || req.url || '';
    const isInvoiceEndpoint = /^\/api\/orders\/[^/]+\/(invoice(?:\.pdf)?)\b/.test(p);
    if (allowQueryToken && isInvoiceEndpoint) {
      const payload = verifyToken(String(req.query.token));
      if (payload) {
        req.user = { id: payload.id, role: payload.role || 'user', email: payload.email };
        return next();
      }
    }
  }
  // Fallback legacy headers (dev mode only unless explicitly allowed)
  const allowDevHeaders = process.env.ALLOW_DEV_HEADERS === 'true' || process.env.NODE_ENV !== 'production';
  if (allowDevHeaders) {
    req.user = {
      id: req.headers['x-user-id'] || 'guest',
      role: req.headers['x-user-role'] || 'guest'
    };
  }
  next();
}

export function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'FORBIDDEN', required: role, got: req.user.role });
    }
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN', required: 'admin', got: req.user.role });
  next();
}

export default { attachUser, requireRole, requireAdmin };
