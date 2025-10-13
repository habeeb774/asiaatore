#!/usr/bin/env node
// Usage: node server/scripts/createAdmin.js email password [name]
import dotenv from 'dotenv';
dotenv.config({ override: true });
import readline from 'readline';
import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';

async function promptHidden(question){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    process.stdout.write(question);
    const onData = (char) => {
      char = char + '';
      switch (char) {
        case '\n': case '\r': case '\u0004':
          process.stdout.write('\n');
          process.stdin.removeListener('data', onData);
          rl.close();
          break;
        default:
          process.stdout.write('*');
          break;
      }
    };
    process.stdin.on('data', onData);
    rl.question('', (value) => resolve(value));
  });
}

async function main(){
  const [,, emailArg, passArg, nameArg] = process.argv;
  let email = emailArg ? emailArg.trim().toLowerCase() : emailArg;
  if (!email) {
    console.error('Email required. Usage: node server/scripts/createAdmin.js admin@example.com');
    process.exit(1);
  }
  let password = passArg;
  if (!password) password = await promptHidden('Password: ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('User already exists with that email.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({ data: { email, password: hash, role: 'admin', name: nameArg || 'System Admin' } });
  console.log('Admin created:', { id: created.id, email: created.email });
  await prisma.$disconnect();
}

main().catch(e => { console.error('Failed:', e); process.exit(1); });