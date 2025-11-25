#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';
import prisma from '../../server/db/client.js';

const PORT = process.env.PORT || 8930; // use a different port to avoid collisions
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
        'x-user-id': 'coupon-user',
        'x-user-role': 'user',
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
  console.log('[order-coupon-smoke] starting server...');
  const child = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: String(PORT), ALLOW_INVALID_DB: 'false', QUICK_START_DB: '1', COUPONS_ENABLED: 'true', ALLOW_DEV_HEADERS: 'true' },
    stdio: ['ignore','pipe','pipe']
  });
  child.stdout.on('data', d => {
    const line = d.toString();
    if (line.includes('Server listening')) console.log('[server]', line.trim());
  });
  child.stderr.on('data', d => console.error('[server-err]', d.toString().trim()));

  // Wait for server
  let ready = false;
  for (let i=0;i<30 && !ready;i++) {
    try {
      const res = await request('GET','/auth/me');
      if (res.status === 200 || res.status === 401) ready = true;
    } catch {}
    if (!ready) await sleep(300);
  }
  if (!ready) {
    console.error('Server did not start in time');
    child.kill();
    process.exit(1);
  }

  console.log('[order-coupon-smoke] creating coupon via prisma...');
  const code = 'TEST10';
  await prisma.coupon.upsert({
    where: { code },
    update: { value: 10, type: 'percent', active: true },
    create: { code, type: 'percent', value: 10, active: true }
  });
  // Reset usedCount for clean run
  await prisma.coupon.update({ where: { code }, data: { usedCount: 0 } });

  console.log('[order-coupon-smoke] creating order with coupon...');
  const orderRes = await request('POST','/orders', { items: [{ productId: 'custom', price: 200, quantity: 1 }], couponCode: code });
  if (orderRes.status !== 201) {
    console.error('Order create failed', orderRes.status, orderRes.json);
    child.kill(); process.exit(1);
  }
  const order = orderRes.json.order;
  console.log('Order created:', { id: order.id, couponDiscount: order.couponDiscount, grandTotal: order.grandTotal });
  if (order.couponDiscount < 19.9 || order.couponDiscount > 20.01) {
    console.error('Unexpected couponDiscount', order.couponDiscount);
    child.kill(); process.exit(1);
  }

  const couponRow = await prisma.coupon.findUnique({ where: { code } });
  console.log('Coupon usedCount after order:', couponRow.usedCount);
  if (couponRow.usedCount !== 1) {
    console.error('Coupon usage not incremented correctly');
    child.kill(); process.exit(1);
  }

  console.log('\nSUCCESS: coupon applied and usage incremented.');
  child.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
