#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';
import prisma from '../../server/db/client.js';

const PORT = process.env.PORT || 8940;
const API = `http://localhost:${PORT}/api`;

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function request(method, path, body, headers={}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(API + path, {
      method,
      headers: {
        'content-type': 'application/json',
        'origin': 'http://localhost:3000',
        ...(data ? { 'content-length': Buffer.byteLength(data) } : {}),
        ...headers
      }
    }, res => {
      let chunks='';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: chunks ? JSON.parse(chunks) : null }); } catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main(){
  console.log('[loyalty-referral-smoke] starting server...');
  const child = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: String(PORT), ALLOW_INVALID_DB: 'false', QUICK_START_DB: '1', ALLOW_DEV_HEADERS: 'true', LOYALTY_ENABLED: 'true', REFERRAL_ENABLED: 'true', LOYALTY_POINTS_RATE: '0.2' },
    stdio: ['ignore','pipe','pipe']
  });
  child.stdout.on('data', d => { const line=d.toString(); if (line.includes('Server listening')) console.log('[server]', line.trim()); });
  child.stderr.on('data', d => console.error('[server-err]', d.toString().trim()));

  // wait until /auth/me responds (even 401)
  let ready=false; for (let i=0;i<40 && !ready;i++){ try { const r= await request('GET','/auth/me'); if ([200,401].includes(r.status)) ready=true; } catch{} if(!ready) await sleep(300); }
  if(!ready){ console.error('Server failed to start'); child.kill(); process.exit(1); }

  // Setup users
  const refUserId = 'ref-user1';
  const referredUserId = 'referred-user2';
  console.log('[loyalty-referral-smoke] ensuring users...');
  await prisma.user.upsert({ where:{ id: refUserId }, update:{}, create:{ id: refUserId, email: 'ref@dev.local', password: '$2a$10$abcdefghijklmnopqrstuv', role:'user', name:'Ref User' } });
  await prisma.user.upsert({ where:{ id: referredUserId }, update:{}, create:{ id: referredUserId, email: 'new@dev.local', password: '$2a$10$abcdefghijklmnopqrstuv', role:'user', name:'Referred User' } });

  // Referral code creation (use service logic like app would)
  console.log('[loyalty-referral-smoke] creating referral code...');
  const code = 'REFABC';
  const existingRef = await prisma.referral.findUnique({ where: { code } });
  if (!existingRef) {
    await prisma.referral.create({ data: { referrerUserId: refUserId, code } });
  } else if (existingRef.referrerUserId !== refUserId) {
    // recreate with deterministic state
    await prisma.referral.delete({ where: { id: existingRef.id } });
    await prisma.referral.create({ data: { referrerUserId: refUserId, code } });
  }

  // Claim referral via API to exercise controller
  console.log('[loyalty-referral-smoke] claiming referral code via API...');
  const claimRes = await request('POST','/referral/claim',{ code }, { 'x-user-id': referredUserId, 'x-user-role': 'user' });
  if (claimRes.status !== 200 || !claimRes.json?.ok) {
    console.error('Referral claim failed', claimRes.status, claimRes.json); child.kill(); process.exit(1);
  }

  // Create order for referred user
  console.log('[loyalty-referral-smoke] creating order for referred user...');
  const orderRes = await request('POST','/orders',{ items:[{ productId:'custom', price:100, quantity:1 }] }, { 'x-user-id': referredUserId, 'x-user-role': 'user' });
  if (orderRes.status !== 201) { console.error('Order create failed', orderRes.status, orderRes.json); child.kill(); process.exit(1); }
  const orderId = orderRes.json.order.id;

  // Transition to paid
  console.log('[loyalty-referral-smoke] marking order paid...');
  const patchRes = await request('PATCH',`/orders/${orderId}`,{ status:'paid' }, { 'x-user-id': referredUserId, 'x-user-role':'user' });
  if (patchRes.status !== 200) { console.error('Order patch failed', patchRes.status, patchRes.json); child.kill(); process.exit(1); }

  // Fetch loyalty balances
  const refBalance = await prisma.user.findUnique({ where:{ id: refUserId }, select:{ loyaltyPoints:true } });
  const referredBalance = await prisma.user.findUnique({ where:{ id: referredUserId }, select:{ loyaltyPoints:true } });

  console.log('Balances:', { referrer: refBalance.loyaltyPoints, referred: referredBalance.loyaltyPoints });

  // Expected: order awards floor( (100 - discount) * 0.2 ) = 20 points to referred user + referral bonus 50; referrer gets 100.
  if (refBalance.loyaltyPoints < 100) { console.error('Referrer points insufficient'); child.kill(); process.exit(1); }
  if (referredBalance.loyaltyPoints < 70) { console.error('Referred user points insufficient'); child.kill(); process.exit(1); }

  // Check referral rewardAppliedAt set
  const refRow = await prisma.referral.findUnique({ where: { code } });
  if (!refRow.rewardAppliedAt) { console.error('Referral rewardAppliedAt not set'); child.kill(); process.exit(1); }

  console.log('\nSUCCESS: loyalty + referral awarding verified.');
  child.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
