/*
  Dev diagnostics: checks API health, WhatsApp diagnostics, and settings PATCH flow.
  Requires API running locally with ALLOW_DEV_HEADERS=true on the specified PORT.
*/

const PORT = Number(process.env.PORT || 8842);
const BASE = `http://localhost:${PORT}`;

async function getJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { status: res.status, body };
}

async function main() {
  const headers = {
    'x-user-id': 'dev-admin',
    'x-user-role': 'admin',
    'content-type': 'application/json'
  };

  console.log(`[1/4] GET ${BASE}/_health`);
  try {
    const h = await getJson(`${BASE}/_health`);
    console.log('  status:', h.status, 'db:', h.body?.db);
  } catch (e) { console.error('  FAILED', e.message); }

  console.log(`[2/4] GET ${BASE}/api/invoices/_whatsapp`);
  try {
    const w = await getJson(`${BASE}/api/invoices/_whatsapp`, { headers });
    console.log('  status:', w.status, 'body:', w.body);
  } catch (e) { console.error('  FAILED', e.message); }

  console.log(`[3/4] GET ${BASE}/api/settings`);
  try {
    const s0 = await getJson(`${BASE}/api/settings`, { headers });
    console.log('  status:', s0.status);
  } catch (e) { console.error('  FAILED', e.message); }

  console.log(`[4/4] PATCH ${BASE}/api/settings (siteNameEn)`);
  try {
    const payload = { siteNameEn: `My Store Dev ${new Date().toISOString().slice(11,19)}` };
    const s1 = await getJson(`${BASE}/api/settings`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    console.log('  status:', s1.status, 'ok:', s1.body?.ok, 'warning:', s1.body?.warning || s1.body?.note);
  } catch (e) { console.error('  FAILED', e.message); }
}

main().catch((e) => { console.error('Diagnostics failed:', e); process.exit(1); });
