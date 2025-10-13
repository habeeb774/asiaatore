#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ override: true });
import mysql from 'mysql2/promise';

function die(msg) { console.error(msg); process.exit(1); }

const urlStr = process.env.DATABASE_URL;
if (!urlStr) die('DATABASE_URL is missing in .env');

let url;
try { url = new URL(urlStr); } catch (e) { die('Invalid DATABASE_URL: ' + e.message); }
if (!/^mysql:$/i.test(url.protocol)) die('DATABASE_URL must start with mysql://');

const sslStrict = /(^|[?&])sslaccept=strict/i.test(url.search);

const config = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username || ''),
  password: decodeURIComponent(url.password || ''),
  database: (url.pathname || '').replace(/^\//, ''),
  ssl: sslStrict ? { rejectUnauthorized: true, minVersion: 'TLSv1.2' } : undefined,
  connectTimeout: 8000,
};

console.log('[DB] Connecting to', `${config.host}:${config.port}/${config.database}`);

const start = Date.now();
let conn;
try {
  conn = await mysql.createConnection(config);
  const [rows] = await conn.query('SELECT 1 AS ok');
  const ms = Date.now() - start;
  console.log('[DB] Connected. Ping ok=%s latencyMs=%d', rows?.[0]?.ok, ms);
  const [tbls] = await conn.query(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name LIMIT 200',
    [config.database]
  );
  console.log('[DB] Tables (%d): %s', tbls.length, tbls.map(r => r.table_name).join(', ') || '(none)');
  try {
    const [migs] = await conn.query('SELECT id, migration_name, applied_steps_count FROM `_prisma_migrations` ORDER BY finished_at DESC LIMIT 10');
    console.log('[DB] _prisma_migrations rows:', migs.length);
    for (const m of migs) console.log('  -', m.migration_name, 'steps=', m.applied_steps_count);
  } catch (e) {
    console.log('[DB] _prisma_migrations not found or unreadable:', e.message);
  }
  process.exit(0);
} catch (e) {
  console.error('[DB] Connection/query failed:', e.message);
  process.exit(1);
} finally {
  try { await conn?.end(); } catch {}
}
