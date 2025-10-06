#!/usr/bin/env node
// Quick credential verifier: node server/scripts/verifyLogin.js email password
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';

async function main(){
  const [,, rawEmail, rawPassword] = process.argv;
  if (!rawEmail || !rawPassword) {
    console.error('Usage: node server/scripts/verifyLogin.js <email> <password>');
    process.exit(1);
  }
  if (rawEmail === 'email' || rawPassword === 'password') {
    console.error('You used placeholder arguments. Replace them with real credentials, e.g. admin2@example.com MyStrongPass!');
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('No user with that email');
    process.exit(2);
  }
  const ok = await bcrypt.compare(rawPassword, user.password);
  if (!ok) {
    console.error('Password mismatch');
    process.exit(3);
  }
  console.log('Credentials valid for user id:', user.id, 'role:', user.role);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(10); });