import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';

const SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
if (SECRET === 'dev_insecure_secret_change_me' && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[AUTH] Using insecure default secret in production. Set AUTH_SECRET or JWT_SECRET!');
}

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '30d';

export function signToken(payload, opts = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL, ...opts });
}

export function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL, ...opts });
}

export function signRefreshToken(payload, opts = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_TTL, ...opts });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (_) {
    return null;
  }
}

export function randomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

export default { signToken, signAccessToken, signRefreshToken, verifyToken, randomToken, sha256 };
