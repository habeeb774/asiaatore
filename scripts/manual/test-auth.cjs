#!/usr/bin/env node
// Simple Node http test to validate the /api/auth/login endpoint.
require('dotenv/config');
const http = require('http');

const base = process.env.API_BASE || 'http://localhost:8829';
const loginUrl = new URL('/api/auth/login', base);

const loginData = JSON.stringify({
  identifier: process.env.ADMIN_IDENTIFIER || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'admin123'
});

const requestOptions = {
  protocol: loginUrl.protocol,
  hostname: loginUrl.hostname,
  port: loginUrl.port || (loginUrl.protocol === 'https:' ? 443 : 80),
  path: loginUrl.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(requestOptions, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Response body:', body);
    try {
      const parsed = JSON.parse(body);
      if (parsed?.ok && parsed?.accessToken) {
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed');
      }
    } catch (error) {
      console.log('⚠️ Could not parse response JSON:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.write(loginData);
req.end();