// Minimal API smoke test for My Store
// Covers: health, login (dev or real), addresses CRUD, seller KYC flows (admin approve/reject)

import http from 'node:http';
import https from 'node:https';

let BASE = process.env.API_BASE || '';
const DEV_HEADERS = process.env.ALLOW_DEV_HEADERS === 'true';

function request(method, path, { headers = {}, body } = {}) {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? new URL(path)
    : new URL(path, BASE || 'http://localhost');
  const isHttps = url.protocol === 'https:';
  const data = body ? JSON.stringify(body) : null;
  const h = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };
  const opts = {
    method,
    headers: data ? { ...h, 'Content-Length': Buffer.byteLength(data) } : h,
  };
  return new Promise((resolve, reject) => {
    const lib = isHttps ? https : http;
    const req = lib.request(url, opts, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        const ct = res.headers['content-type'] || '';
        let json = null;
        try { if (ct.includes('application/json')) json = JSON.parse(buf); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, text: buf, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION_FAILED: ' + msg);
}

function heading(title) {
  console.log('\n=== ' + title + ' ===');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureBase() {
  if (BASE) return BASE; // user-provided
  const ports = [4005, 4006, 4007, 4008, 4009, 4010];
  for (const p of ports) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await request('GET', `http://localhost:${p}/_health`);
        if (res.status === 200) {
          BASE = `http://localhost:${p}`;
          console.log(`[detect] Using API at ${BASE}`);
          return BASE;
        }
      } catch {}
      await sleep(200);
    }
  }
  throw new Error('NO_SERVER');
}

(async () => {
  try {
    try {
      await ensureBase();
    } catch (e) {
      if (e && e.message === 'NO_SERVER') {
        console.error('No API detected on 4005-4010 and API_BASE not set. Start the server first or set API_BASE.');
      }
      throw e;
    }
    heading('Health');
    // retry health a bit in case server just started
    let health;
    for (let i = 0; i < 5; i++) {
      try {
        health = await request('GET', '/_health');
        break;
      } catch (e) {
        if (i === 4) throw e;
        await sleep(200);
      }
    }
    console.log('Health:', health.status, health.json);
    assert(health.status === 200, 'health should be 200');

    heading('Login (dev or real)');
    // Try real login first (seeded admin)
    let login = await request('POST', '/api/auth/login', {
      body: { email: 'admin@example.com', password: 'Admin123!' }
    });
    if (login.status !== 200) {
      console.log('Admin login failed, trying dev user...');
      login = await request('POST', '/api/auth/login', { body: { email: 'user@example.com', password: 'user123' } });
    }
    console.log('Login status:', login.status, login.json);
    assert(login.status === 200, 'login should succeed');
    const accessToken = login.json?.accessToken;
    assert(accessToken, 'accessToken must exist');

    const auth = { Authorization: 'Bearer ' + accessToken };

    heading('Addresses CRUD');
    const createAddr = await request('POST', '/api/addresses', { headers: auth, body: {
      label: 'Home', name: 'Test User', phone: '+966501234567', country: 'SA', city: 'Riyadh', district: 'Center', street: 'King St', building: '12', apartment: '3A', notes: 'Ring bell', isDefault: true
    }});
    console.log('Create address:', createAddr.status, createAddr.json);
    assert(createAddr.status === 201, 'address create 201');
    const addrId = createAddr.json?.address?.id;
    assert(addrId, 'created address id');

    const list = await request('GET', '/api/addresses', { headers: auth });
    console.log('List addresses:', list.status, list.json?.addresses?.length);
    assert(list.status === 200 && Array.isArray(list.json?.addresses), 'addresses list ok');

    const setDefaultOff = await request('PATCH', `/api/addresses/${addrId}`, { headers: auth, body: { isDefault: false, notes: 'No bell' } });
    console.log('Update address:', setDefaultOff.status, setDefaultOff.json);
    assert(setDefaultOff.status === 200, 'address update 200');

    const del = await request('DELETE', `/api/addresses/${addrId}`, { headers: auth });
    console.log('Delete address:', del.status, del.json);
    assert(del.status === 200, 'address delete 200');

    heading('Seller KYC (admin review)');
    // Login as seller for submit
    let sellerLogin = await request('POST', '/api/auth/login', { body: { email: 'seller@example.com', password: 'Seller123!' } });
    if (sellerLogin.status !== 200) {
      console.log('Seller login failed, trying dev user as seller');
      sellerLogin = login; // fallback
    }
    const sellerAuth = { Authorization: 'Bearer ' + (sellerLogin.json?.accessToken) };
    const kycSubmit = await request('POST', '/api/sellers/profile', { headers: sellerAuth, body: {
      companyName: 'Demo Co', crNumber: '1234567890', iban: 'SA03 8000 0000 6080 1016 7519', bankName: 'SAB', addressText: 'Riyadh', documents: { id: 'ABC' }
    }});
    console.log('Seller KYC submit:', kycSubmit.status, kycSubmit.json?.ok);
    assert(kycSubmit.status === 200, 'kyc submit ok');

    // Approve via admin token from earlier login
    const listSellers = await request('GET', '/api/admin/sellers', { headers: auth });
    console.log('Admin list sellers:', listSellers.status, listSellers.json?.total);
    assert(listSellers.status === 200, 'admin list sellers ok');
    const target = listSellers.json?.items?.[0];
    if (target?.id) {
      const approve = await request('POST', `/api/admin/sellers/${target.id}/approve`, { headers: auth, body: {} });
      console.log('Approve KYC:', approve.status, approve.json?.ok);
      assert(approve.status === 200, 'approve ok');
      const reject = await request('POST', `/api/admin/sellers/${target.id}/reject`, { headers: auth, body: { reason: 'test-only' } });
      console.log('Reject KYC:', reject.status, reject.json?.ok);
      assert(reject.status === 200, 'reject ok');
    } else {
      console.log('No sellers found to approve/reject, skipped.');
    }

    console.log('\nAll smoke checks passed.');
    process.exit(0);
  } catch (e) {
    console.error('Smoke test failed:', e?.stack || e?.message || e);
    process.exit(1);
  }
})();
