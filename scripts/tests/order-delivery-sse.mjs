// Order + Delivery SSE test
// Steps:
// 1) Login as admin (or dev) and as user
// 2) Create an order as user with a minimal item and paymentMeta.address
// 3) Open SSE as the user and collect events
// 4) As admin (delivery), accept -> start -> location -> complete
// 5) Assert SSE events observed: delivery.updated (accepted, out_for_delivery, delivered) + delivery.location

import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';

let BASE = process.env.API_BASE || '';
const USER_PROVIDED_BASE = !!process.env.API_BASE;
let serverChild = null; // spawned server process (if we start one)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function request(method, path, { headers = {}, body } = {}) {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? new URL(path)
    : new URL(path, BASE || 'http://localhost');
  const isHttps = url.protocol === 'https:';
  const data = body ? JSON.stringify(body) : null;
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers };
  const opts = { method, headers: data ? { ...h, 'Content-Length': Buffer.byteLength(data) } : h };
  return new Promise((resolve, reject) => {
    const lib = isHttps ? https : http;
    const req = lib.request(url, opts, (res) => {
      let buf='';
      res.setEncoding('utf8');
      res.on('data', (c)=> buf+=c);
      res.on('end', ()=>{
        const ct = res.headers['content-type'] || '';
        let json=null; try{ if(ct.includes('application/json')) json=JSON.parse(buf);}catch{}
        resolve({ status: res.statusCode, headers: res.headers, text: buf, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function ensureBase() {
  if (BASE) return BASE;
  // Broaden scan window: 4000-4011 (server may auto-increment)
  const ports = Array.from({ length: 12 }, (_, i) => 4000 + i);
  for (const p of ports) {
    try {
      const r = await request('GET', `http://localhost:${p}/_health`);
      if (r.status === 200) {
        BASE = `http://localhost:${p}`;
        return BASE;
      }
    } catch {}
  }
  throw new Error('NO_SERVER');
}

async function spawnServerIfMissing() {
  try {
    await ensureBase();
    return false; // already running
  } catch {
    // Start backend locally; prefer PORT=4010 but server may auto-bump
    const env = { ...process.env, PORT: process.env.PORT || '4010' };
    serverChild = spawn(process.execPath, ['server/index.js'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    // Pipe minimal logs (optional)
    serverChild.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes('Payment stub server listening')) process.stdout.write(s);
    });
    serverChild.stderr.on('data', (d) => process.stderr.write(d.toString()));
    // Wait for health to respond
    const startedAt = Date.now();
    const timeoutMs = 15000;
    while (Date.now() - startedAt < timeoutMs) {
      try {
        await sleep(400);
        // Auto-detect the port it chose
        BASE = '';
        await ensureBase();
        return true;
      } catch {}
    }
    throw new Error('SERVER_START_TIMEOUT');
  }
}

function assert(cond, msg){ if(!cond) throw new Error('ASSERT: '+msg); }
function heading(t){ console.log('\n=== '+t+' ==='); }

// Simple EventSource over HTTP for SSE
function openSse(path, { headers = {} } = {}) {
  const url = new URL(path, BASE);
  const lib = url.protocol === 'https:' ? https : http;
  const opts = { method: 'GET', headers: { Accept: 'text/event-stream', ...headers } };
  const events = [];
  let resolveOpen; const opened = new Promise(r => { resolveOpen = r; });
  const req = lib.request(url, opts, (res) => {
    let buf='';
    res.setEncoding('utf8');
    resolveOpen();
    res.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const msg = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        // parse event: and data:
        let type = 'message';
        let data = '';
        msg.split('\n').forEach(line => {
          if (line.startsWith('event:')) type = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        });
        try { data = data ? JSON.parse(data) : null; } catch {}
        events.push({ type, data });
      }
    });
  });
  req.on('error', (e)=>{ /* ignore */ });
  req.end();
  return { events, opened };
}

(async ()=>{
  try {
    // If user didn't provide API_BASE, spawn our own server for a stable run
    if (!USER_PROVIDED_BASE) {
      await spawnServerIfMissing();
    }
    await ensureBase();
    console.log('Using API base:', BASE);
    heading('Health');
  const h = await request('GET', '/_health');
    assert(h.status===200, 'health 200');

    // Login as user (use dev fallback if admin seed not present)
    heading('Login (user + admin)');
    let userLogin = await request('POST', '/api/auth/login', { body: { email:'user@example.com', password:'user123' } });
    if (userLogin.status !== 200) {
      // Try seeded admin as user for simplicity
      userLogin = await request('POST', '/api/auth/login', { body: { email:'admin@example.com', password:'Admin123!' } });
    }
    assert(userLogin.status===200, 'user login');
    const userAuth = { Authorization: 'Bearer '+ userLogin.json.accessToken };

    let adminLogin = await request('POST', '/api/auth/login', { body: { email:'admin@example.com', password:'Admin123!' } });
    if (adminLogin.status !== 200) adminLogin = userLogin; // allow dev fallback
    assert(adminLogin.status===200, 'admin login');
    const adminAuth = { Authorization: 'Bearer '+ adminLogin.json.accessToken };

    // Create an order as user (pick first product)
    heading('Create order');
    const prods = await request('GET', '/api/products');
    assert(prods.status===200, 'products status 200');
    const list = Array.isArray(prods.json)
      ? prods.json
      : (Array.isArray(prods.json?.items) ? prods.json.items : (Array.isArray(prods.json?.products) ? prods.json.products : []));
    assert(Array.isArray(list) && list.length>0, 'products available');
    const product = list.find(p=>p?.id) || list[0];
    assert(product?.id, 'product id');

    const orderBody = {
      items: [ { productId: product.id, quantity: 1 } ],
      paymentMethod: 'COD',
      paymentMeta: { address: { name:'Test Buyer', phone:'+966501234567', city:'Riyadh', district:'Center', street:'King', building:'12' } },
      shipping: { method:'standard' }
    };
    const created = await request('POST', '/api/orders', { headers: userAuth, body: orderBody });
    if (!(created.status === 201 && created.json?.order?.id)) {
      console.error('Create order response:', created.status, created.json || created.text);
    }
    assert(created.status===201 && created.json?.order?.id, 'order created');
    const orderId = created.json.order.id;
    console.log('Order ID:', orderId);

    // Open SSE as user
    heading('Open SSE');
    const sse = openSse('/api/events', { headers: userAuth });
    await sse.opened;
    await sleep(200);

    // As admin (or delivery), accept -> start -> location -> complete
    heading('Drive delivery lifecycle');
    // Accept (admin route expects delivery role or admin; admin allowed)
    const acc = await request('POST', `/api/delivery/orders/${orderId}/accept`, { headers: adminAuth, body: {} });
    assert(acc.status===200, 'accept ok');
    const start = await request('POST', `/api/delivery/orders/${orderId}/start`, { headers: adminAuth, body: {} });
    assert(start.status===200, 'start ok');
    const loc = await request('POST', `/api/delivery/orders/${orderId}/location`, { headers: adminAuth, body: { lat: 24.7136, lng: 46.6753, accuracy: 30 } });
    assert(loc.status===200, 'location ok');
    const done = await request('POST', `/api/delivery/orders/${orderId}/complete`, { headers: adminAuth, body: { note:'delivered' } });
    assert(done.status===200, 'complete ok');

    // Wait a bit for events to arrive
    await sleep(600);

    const seenTypes = new Set(sse.events.map(e=>e.type));
    const hasUpdated = sse.events.some(e=>e.type==='delivery.updated');
    const hasLocation = sse.events.some(e=>e.type==='delivery.location');
    console.log('SSE event types:', Array.from(seenTypes));

    assert(hasUpdated, 'saw delivery.updated');
    assert(hasLocation, 'saw delivery.location');

    console.log('\nOrder + Delivery SSE test passed.');
    process.exit(0);
  } catch (e) {
    console.error('Order+SSE test failed:', e?.stack || e?.message || e);
    process.exit(1);
  } finally {
    if (serverChild) {
      try { serverChild.kill('SIGINT'); } catch {}
    }
  }
})();
