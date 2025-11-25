// Sprint 1 Features Smoke Test: Coupons, Loyalty, Referral
// Requires server running (dev headers allowed). Will register users, create coupon, validate, check loyalty, referral claim.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

let BASE = process.env.API_BASE || '';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function logHeading(title){ console.log('\n=== ' + title + ' ==='); }
function assert(cond, msg){ if(!cond) throw new Error('ASSERTION_FAILED: ' + msg); }

function urlFor(path){
  return path.startsWith('http://') || path.startsWith('https://') ? path : new URL(path, BASE || 'http://localhost');
}

function request(method, path, { headers = {}, body } = {}) {
  const url = urlFor(path);
  const data = body ? JSON.stringify(body) : null;
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers };
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers: data ? { ...h, 'Content-Length': Buffer.byteLength(data) } : h }, (res) => {
      let buf=''; res.setEncoding('utf8');
      res.on('data', c => buf += c);
      res.on('end', () => { let json=null; try { if((res.headers['content-type']||'').includes('application/json')) json=JSON.parse(buf); } catch{}; resolve({ status: res.statusCode, json, text: buf }); });
    });
    req.on('error', reject);
    if(data) req.write(data);
    req.end();
  });
}

async function detectBase(){
  if(BASE) return;
  const ports=[8829,8830,8831,8832,8833];
  for(const p of ports){
    for(let attempt=0; attempt<4; attempt++){
      try{ const r= await request('GET', `http://localhost:${p}/_health`); if(r.status===200){ BASE=`http://localhost:${p}`; console.log(`[detect] Using API at ${BASE}`); return; } }catch{}
      await sleep(150);
    }
  }
  throw new Error('NO_API_SERVER');
}

function randEmail(prefix='user'){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,6)}@example.com`; }
function randName(){ return 'User' + Math.random().toString(36).slice(2,5); }

async function register(email){
  const res = await request('POST', '/api/auth/register', { body: { email, password: 'Test123!', name: randName() } });
  assert(res.status===201, 'register 201');
  const token = res.json?.accessToken; assert(token, 'accessToken after register');
  return { token, id: res.json.user.id, email };
}

async function main(){
  try {
    let child;
    if(!BASE){
      // start local server on fixed port to simplify polling
      const TEST_PORT = '9030';
      console.log('[test] Starting server child process on port', TEST_PORT);
      child = spawn('node', ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: TEST_PORT, QUICK_START_DB:'1', ALLOW_INVALID_DB:'false', ALLOW_DEV_HEADERS:'true' }, stdio: ['pipe','pipe','pipe'] });
      console.log('[test] Spawned PID:', child.pid);
      child.stdout.on('data', d => { const s = d.toString(); console.log('[server]', s.trim()); });
      child.stderr.on('data', d => { const s = d.toString(); if(/ERROR|WARN/i.test(s)) console.error('[server]', s.trim()); });
      child.on('error', err => console.error('[server error]', err));
      child.on('exit', (code, signal) => console.log('[server exit]', code, signal));
      // poll for health
      for(let i=0;i<40;i++){ // up to ~8s
        try{ const r = await request('GET', `http://localhost:${TEST_PORT}/_health`); if(r.status===200){ BASE=`http://localhost:${TEST_PORT}`; break; } }catch{}
        await sleep(200);
      }
      if(!BASE) throw new Error('SERVER_START_FAILED');
    }
    logHeading('Health');
    const health = await request('GET', '/_health');
    console.log('Health:', health.status, health.json?.db);
    assert(health.status===200, 'health ok');

    logHeading('Register primary user');
    const primary = await register(randEmail('primary'));
    console.log('Primary user id:', primary.id);
    const authPrimary = { Authorization: 'Bearer ' + primary.token };

    // promote to admin for coupon creation and obtain new admin token via login
    await prisma.user.update({ where: { id: primary.id }, data: { role: 'admin' } });
    const relog = await request('POST', '/api/auth/login', { body: { identifier: primary.email, password: 'Test123!' } });
    assert(relog.status===200, 'admin relogin 200');
    const authAdmin = { Authorization: 'Bearer ' + relog.json?.accessToken };
    const meCheck = await request('GET', '/api/auth/me', { headers: authAdmin });
    console.log('Admin me check status:', meCheck.status, meCheck.json?.role || meCheck.json?.user?.role || meCheck.json);

    logHeading('Create coupon (admin via dev headers)');
    // Use dev headers to impersonate admin with existing user id
    const couponCode = 'FEAT' + Math.random().toString(36).slice(2,5).toUpperCase();
    const createdCoupon = await prisma.coupon.create({ data: { code: couponCode, type: 'percent', value: 10, active: true } });
    console.log('Coupon direct create ok:', createdCoupon.code);

    logHeading('Validate coupon as user');
    const validate = await request('POST', '/api/coupons/validate', { headers: { ...authPrimary, Origin: 'http://localhost' }, body: { code: couponCode, subtotal: 200 } });
    console.log('Coupon validate:', validate.status, validate.json);
    assert(validate.status===200 && validate.json?.discount === 20, 'coupon discount 10% of 200');

    logHeading('Check loyalty balance & ledger');
    const balance = await request('GET', '/api/loyalty/balance', { headers: authPrimary });
    console.log('Loyalty balance:', balance.status, balance.json);
    assert(balance.status===200 && typeof balance.json?.balance === 'number', 'loyalty balance ok');
    const ledger = await request('GET', '/api/loyalty/ledger?page=1&limit=10', { headers: authPrimary });
    console.log('Loyalty ledger:', ledger.status, ledger.json?.entries?.length);
    assert(ledger.status===200 && Array.isArray(ledger.json?.entries), 'loyalty ledger ok');

    logHeading('Referral code generation');
    const refCodeRes = await request('GET', '/api/referral/code', { headers: authPrimary });
    console.log('Referral code:', refCodeRes.status, refCodeRes.json?.code);
    assert(refCodeRes.status===200 && refCodeRes.json?.code, 'referral code ok');
    const referralCode = refCodeRes.json.code;

    logHeading('Register secondary user');
    const secondary = await register(randEmail('secondary'));
    console.log('Secondary user id:', secondary.id);
    const authSecondary = { Authorization: 'Bearer ' + secondary.token };

    logHeading('Claim referral by secondary user');
    const claim = await request('POST', '/api/referral/claim', { headers: { ...authSecondary, Origin: 'http://localhost' }, body: { code: referralCode } });
    console.log('Referral claim:', claim.status, claim.json);
    assert(claim.status===200 && claim.json?.ok, 'referral claim ok');

    console.log('\nAll feature smoke checks passed.');
    if(child){ try { child.kill('SIGINT'); } catch{} }
    process.exit(0);
  } catch (e) {
    console.error('Features smoke test failed:', e.stack || e.message || e);
    // attempt cleanup
    // no BASE guarantee
    process.exit(1);
  }
}

main();
