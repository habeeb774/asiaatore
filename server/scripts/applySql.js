#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main(){
  const filename = process.argv[2] || 'scripts/Store_DB.sql';
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    console.error('SQL file not found:', filePath);
    process.exit(1);
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('mysql://')) {
    console.error('DATABASE_URL must be mysql://... Current:', dbUrl);
    process.exit(2);
  }
  const u = new url.URL(dbUrl);
  // Connect without database first to ensure CREATE DATABASE works
  const baseConfig = {
    host: u.hostname,
    port: +(u.port || 3306),
    user: u.username,
    password: u.password,
    multipleStatements: true,
  };
  const conn = await mysql.createConnection(baseConfig);
  try {
    // Split statements on semicolons but keep USE and ALTER etc.; naive split works for our file
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        // Ignore exists/duplicate errors to make idempotent
        if (err && (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CANT_CREATE_TABLE' || err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANNOT_ADD_FOREIGN')) {
          console.warn('Skipping statement due to benign error:', err.code);
          continue;
        }
        throw err;
      }
    }
    console.log('SQL applied successfully:', filename);
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
