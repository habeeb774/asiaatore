import dotenv from 'dotenv';
dotenv.config({ override: true });
import prisma from '../db/client.js';

async function main() {
  try {
    const [{ db }] = await prisma.$queryRaw`SELECT DATABASE() AS db`;
    const rows = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = 'transaction'`,
      db
    );
    console.log('[DB-CHECK] Schema:', db, 'Has transaction table?', rows.length > 0);
  } catch (e) {
    console.error('[DB-CHECK] Error:', e);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
}

main();
