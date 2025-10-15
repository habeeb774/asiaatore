#!/usr/bin/env node
import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath, override: true });
} else {
  config();
}

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('[DB Reset] DATABASE_URL is not set. Please define it in your .env file.');
  process.exit(1);
}

const trimmed = rawUrl.trim().replace(/^"|"$/g, '');
let url;
try {
  url = new URL(trimmed);
} catch (error) {
  console.error('[DB Reset] DATABASE_URL is invalid:', error.message);
  process.exit(1);
}

if (url.protocol !== 'mysql:') {
  console.error('[DB Reset] DATABASE_URL must use the mysql:// protocol. Received:', url.protocol);
  process.exit(1);
}

const database = url.pathname.replace(/^\//, '');
if (!database) {
  console.error('[DB Reset] Database name is missing in DATABASE_URL.');
  process.exit(1);
}

const host = url.hostname || 'https://asiaatore-production.up.railway.app';
const port = url.port ? Number(url.port) : 3306;
const user = decodeURIComponent(url.username || 'root');
const password = decodeURIComponent(url.password || '');

async function dropAndCreateDatabase() {
  console.log(`[DB Reset] Connecting to MySQL server at ${host}:${port} as ${user || '<empty-user>'}...`);
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });
  try {
    console.log(`[DB Reset] Dropping database \`${database}\` (if it exists)...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    console.log(`[DB Reset] Creating database \`${database}\`...`);
    await connection.query(`CREATE DATABASE \`${database}\``);
    console.log('[DB Reset] Database recreated successfully.');
  } finally {
    await connection.end();
  }
}

function runCommand(command, args) {
  const isWindows = process.platform === 'win32';
  const result = isWindows
    ? spawnSync('cmd.exe', ['/c', command, ...args], { stdio: 'inherit' })
    : spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`[DB Reset] Failed to execute ${command}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

(async () => {
  try {
    await dropAndCreateDatabase();
  } catch (error) {
    console.error('[DB Reset] Error while preparing database:', error.message);
    process.exit(1);
  }

  console.log('[DB Reset] Applying Prisma schema (prisma db push)...');
  runCommand('npx', ['prisma', 'db', 'push']);

  console.log('[DB Reset] Seeding database (server/db/seed.js)...');
  runCommand('node', ['server/db/seed.js']);

  console.log('[DB Reset] Done. Database is synchronized and seeded.');
})();
