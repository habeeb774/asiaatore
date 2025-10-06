#!/usr/bin/env node
// Usage: node server/scripts/showUser.js email@example.com
import 'dotenv/config';
import prisma from '../db/client.js';

async function main(){
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('Usage: node server/scripts/showUser.js email@example.com');
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('No user found with email:', email);
    process.exit(2);
  }
  const { id, role, name, createdAt, updatedAt } = user;
  console.log('User:', { id, email: user.email, role, name, createdAt, updatedAt });
  console.log('Password hash (first 20 chars):', user.password.slice(0,20) + '...');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(10); });