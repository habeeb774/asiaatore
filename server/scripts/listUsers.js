#!/usr/bin/env node
// List all users (id, email, role) to help diagnose login issues
import 'dotenv/config';
import prisma from '../db/client.js';

async function main(){
  const users = await prisma.user.findMany({ select:{ id:true, email:true, role:true, name:true, createdAt:true } , orderBy:{ createdAt:'asc' } });
  if (!users.length) {
    console.log('No users found in the database.');
  } else {
    console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name, created: u.createdAt })));
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(10); });