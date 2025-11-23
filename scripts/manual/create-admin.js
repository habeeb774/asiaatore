#!/usr/bin/env node
// Attempts common admin credentials and optionally registers a fallback test user.
import 'dotenv/config';

const API_BASE = process.env.API_BASE?.replace(/\/$/, '') || 'http://localhost:8829';
const LOGIN_URL = `${API_BASE}/api/auth/login`;
const REGISTER_URL = `${API_BASE}/api/auth/register`;

const commonAdmins = [
  { identifier: 'admin@example.com', password: 'admin123' },
  { identifier: 'admin@test.com', password: 'admin123' },
  { identifier: 'admin', password: 'admin123' },
  { identifier: 'root', password: 'admin123' }
];

async function tryLogin(identifier, password) {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (payload?.ok && payload?.accessToken) {
    return payload;
  }

  return null;
}

async function registerFallbackUser() {
  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser@example.com',
      password: 'test1234',
      name: 'Test User',
      phone: '+966500000000'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Failed to create fallback user:', errorText);
    return null;
  }

  const payload = await response.json();
  console.log('✅ Test user created successfully');
  return payload;
}

async function main() {
  console.log(`Target base URL: ${API_BASE}`);

  for (const creds of commonAdmins) {
    console.log(`Trying credentials for: ${creds.identifier}`);
    try {
      const result = await tryLogin(creds.identifier, creds.password);
      if (result) {
        console.log('✅ Login successful!');
        console.log('User:', result.user);
        console.log('Access token preview:', `${result.accessToken.slice(0, 32)}...`);
        return;
      }
    } catch (error) {
      console.error('Login attempt failed:', error.message);
    }
  }

  console.log('❌ No common admin credentials worked. Attempting to register a test user...');
  await registerFallbackUser();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exitCode = 1;
});