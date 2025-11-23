#!/usr/bin/env node
// Smoke test: login as admin and call admin review endpoints.
import 'dotenv/config';

const API_BASE = process.env.API_BASE?.replace(/\/$/, '') || 'http://localhost:8829';
const LOGIN_URL = `${API_BASE}/api/auth/login`;
const ADMIN_REVIEWS_URL = `${API_BASE}/api/admin/reviews`;
const ADMIN_REVIEW_STATS_URL = `${API_BASE}/api/admin/reviews/stats`;

async function main() {
  console.log(`API base: ${API_BASE}`);

  const loginResponse = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@example.com', password: 'admin123' })
  });

  const loginPayload = await loginResponse.json().catch(() => ({}));
  console.log('Login status:', loginResponse.status);
  console.log('Login payload:', JSON.stringify(loginPayload, null, 2));

  if (!loginResponse.ok || !loginPayload?.accessToken) {
    console.log('❌ Login failed');
    return;
  }

  const authHeader = { Authorization: `Bearer ${loginPayload.accessToken}` };

  const reviewsResponse = await fetch(ADMIN_REVIEWS_URL, { headers: authHeader });
  const reviewsPayload = await reviewsResponse.json().catch(() => ({}));
  console.log('\nReviews status:', reviewsResponse.status);
  console.log('Reviews payload:', JSON.stringify(reviewsPayload, null, 2));

  const statsResponse = await fetch(ADMIN_REVIEW_STATS_URL, { headers: authHeader });
  const statsPayload = await statsResponse.json().catch(() => ({}));
  console.log('\nReview stats status:', statsResponse.status);
  console.log('Review stats payload:', JSON.stringify(statsPayload, null, 2));
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exitCode = 1;
});