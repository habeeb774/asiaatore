#!/usr/bin/env node
import 'dotenv/config';
import prisma from '../db/client.js';

async function main(){
  const [,, email] = process.argv;
  if (!email) {
    console.log('Usage: node server/scripts/listTokens.js user@example.com');
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) { console.error('No user'); process.exit(2); }
  const tokens = await prisma.authToken.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  console.log(tokens.map(t => ({ id: t.id, type: t.type, expiresAt: t.expiresAt, consumedAt: t.consumedAt, createdAt: t.createdAt })));
  await prisma.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(10); });
