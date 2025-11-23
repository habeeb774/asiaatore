#!/usr/bin/env node
// Logs into the API and exercises a few authenticated endpoints for quick diagnostics.
import 'dotenv/config';

const API_BASE = process.env.API_BASE?.replace(/\/$/, '') || 'http://localhost:8829';
const LOGIN_URL = `${API_BASE}/api/auth/login`;
const ME_URL = `${API_BASE}/api/auth/me`;
const ADMIN_REVIEWS_URL = `${API_BASE}/api/admin/reviews`;

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }
  return { response, data };
}

async function main() {
  console.log(`Target base URL: ${API_BASE}`);
  logSection('Testing Login');

  const { response: loginResponse, data: loginData } = await fetchJson(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@example.com', password: 'admin123' })
  });

  console.log('Status:', loginResponse.status);
  console.log('Payload:', JSON.stringify(loginData, null, 2));

  if (!loginResponse.ok || !loginData?.accessToken) {
    console.log('❌ Login failed, aborting.');
    return;
  }

  const token = loginData.accessToken;
  console.log('Access token preview:', `${token.slice(0, 32)}...`);

  const authHeaders = { Authorization: `Bearer ${token}` };

  logSection('Testing /api/auth/me');
  const { response: meResponse, data: meData } = await fetchJson(ME_URL, { headers: authHeaders });
  console.log('Status:', meResponse.status);
  console.log('Payload:', typeof meData === 'string' ? meData : JSON.stringify(meData, null, 2));

  logSection('Testing /api/admin/reviews');
  const { response: reviewsResponse, data: reviewsData } = await fetchJson(ADMIN_REVIEWS_URL, { headers: authHeaders });
  console.log('Status:', reviewsResponse.status);
  console.log('Payload:', typeof reviewsData === 'string' ? reviewsData : JSON.stringify(reviewsData, null, 2));
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exitCode = 1;
});