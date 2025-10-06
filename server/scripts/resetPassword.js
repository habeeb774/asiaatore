#!/usr/bin/env node
// Usage: node server/scripts/resetPassword.js <email> <newPassword>
// Dev helper to force-set a password hash for a user when login troubleshooting.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';

async function main(){
  const [,, rawEmail, rawPass] = process.argv;
  if(!rawEmail || !rawPass){
    console.error('Usage: node server/scripts/resetPassword.js <email> <newPassword>');
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();
  if(rawPass.length < 8){
    console.error('Password must be at least 8 characters.');
    process.exit(2);
  }
  const user = await prisma.user.findUnique({ where:{ email } });
  if(!user){
    console.error('No such user:', email);
    process.exit(3);
  }
  const hash = await bcrypt.hash(rawPass, 12);
  await prisma.user.update({ where:{ email }, data:{ password: hash } });
  console.log('Password reset OK for', email);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('resetPassword failed:', e); process.exit(10); });