import dotenv from 'dotenv';
dotenv.config({ override: true });
import prisma from '../db/client.js';

// Dev-only helper: Drop all tables in the current database schema.
// Use it when prisma db push/migrate fails due to InnoDB tablespace leftovers.
// WARNING: This will delete ALL TABLES and DATA in the connected schema.

async function main() {
  console.log('[DB-NUKE] Starting (THIS WILL DROP ALL TABLES IN THE CURRENT SCHEMA)');
  try {
    // Determine target schema from DATABASE_URL or DB_NAME
    let target = process.env.DB_NAME || null;
    try {
      const url = process.env.DATABASE_URL || '';
      if (url && url.startsWith('mysql://')) {
        const u = new URL(url);
        const schema = decodeURIComponent(u.pathname || '').replace(/^\//,'');
        if (schema) target = schema;
      }
    } catch {}
    if (!target) {
      // fallback to current selected DB
      const [{ db }] = await prisma.$queryRaw`SELECT DATABASE() AS db`;
      target = db;
    }
    console.log('[DB-NUKE] Target schema:', target);

    // Disable FK checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');

    // List all tables in current schema
    const tables = await prisma.$queryRawUnsafe(
      `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?`,
      target
    );
    const names = (tables || []).map((t) => t.name);
    console.log(`[DB-NUKE] Found ${names.length} tables.`);

    for (const name of names) {
      try {
        console.log('[DB-NUKE] Dropping table:', name);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${target}\`.\`${name}\``);
      } catch (e) {
        console.warn('[DB-NUKE] Failed to drop', name, '-', e.message);
      }
    }

    // Re-enable FK checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');

    console.log('[DB-NUKE] Done. All tables dropped.');
  } catch (e) {
    console.error('[DB-NUKE] Error:', e);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
}

main();
