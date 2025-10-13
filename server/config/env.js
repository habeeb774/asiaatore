// Centralized environment configuration helpers
// Loads values from process.env; dotenv is loaded in server/index.js

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProd = NODE_ENV === 'production';

// App base URL (external URL for links in emails, invoices, etc.)
export const APP_BASE_URL = process.env.APP_BASE_URL || process.env.BASE_URL || '';
export const BASE_URL = APP_BASE_URL; // alias for clarity

// Database URL (mysql://...)
export const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL || '';

// CORS allow list (comma-separated)
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
export const allowedOriginsFromEnv = () =>
  (CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Flags
export const FORCE_HTTPS = process.env.FORCE_HTTPS === 'true';
export const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
export const HELMET_CSP = process.env.HELMET_CSP === 'true';

export default {
  NODE_ENV,
  isProd,
  APP_BASE_URL,
  BASE_URL,
  DATABASE_URL,
  CORS_ORIGIN,
  allowedOriginsFromEnv,
  FORCE_HTTPS,
  TRUST_PROXY,
  HELMET_CSP,
};
