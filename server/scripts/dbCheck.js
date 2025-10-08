#!/usr/bin/env node
// Quick DB + users diagnostic
import dotenv from 'dotenv';
dotenv.config({ override: true });
import prisma from '../db/client.js';

function maskDbUrl(url){
  if(!url) return '(missing)';
  try {
    const u = new URL(url);
    if(u.password) u.password = '***';
    return u.toString();
  } catch { return url.replace(/:(?:[^:@/]+)@/, ':***@'); }
}

async function main(){
  const dbUrl = process.env.DATABASE_URL;
  console.log('[DB] DATABASE_URL:', maskDbUrl(dbUrl));
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count()
  ]);
  console.log('[DB] Counts => users:', counts[0], 'products:', counts[1], 'orders:', counts[2]);
  const users = await prisma.user.findMany({ take: 10, orderBy:{ createdAt:'asc' } });
  if(!users.length) console.log('[DB] No users present.');
  else console.table(users.map(u=>({ id:u.id, email:u.email, role:u.role, created:u.createdAt })));
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('dbCheck failed', e); process.exit(1); });