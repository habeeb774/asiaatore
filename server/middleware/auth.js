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
      // Do not early-return: allow dev headers to adjust role in non-production if configured
    }
  }
  // Support token via query string for GET requests (restricted):
  // - Only for invoice endpoints and SSE events
  // - Enabled by ALLOW_QUERY_TOKEN=true or any non-production NODE_ENV
  if (req.method === 'GET' && req.query && req.query.token) {
    const allowQueryToken = process.env.ALLOW_QUERY_TOKEN === 'true' || process.env.NODE_ENV !== 'production';
    const p = req.originalUrl || req.url || '';
    const isInvoiceEndpoint = /^\/api\/orders\/[^/]+\/(invoice(?:\.pdf)?)\b/.test(p);
    const isSseEvents = /^\/api\/events\b/.test(p);
    if (allowQueryToken && (isInvoiceEndpoint || isSseEvents)) {
      const payload = verifyToken(String(req.query.token));
      if (payload) {
        req.user = { id: payload.id, role: payload.role || 'user', email: payload.email };
        // Do not early-return: allow dev headers to adjust in non-production
      }
    }
  }
  // Fallback legacy headers (dev mode only unless explicitly allowed)
  const allowDevHeaders = process.env.ALLOW_DEV_HEADERS === 'true' || process.env.NODE_ENV !== 'production';
  if (allowDevHeaders) {
    const hdrId = req.headers['x-user-id'];
    const hdrRole = req.headers['x-user-role'];
    // Merge on top of any existing user (from token) to allow temporary role elevation in dev
    req.user = {
      id: hdrId || req.user?.id || 'guest',
      role: hdrRole || req.user?.role || 'guest',
      email: req.user?.email || null
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
