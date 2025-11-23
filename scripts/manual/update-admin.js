#!/usr/bin/env node
// Resets the first admin user's password and validates privileged endpoints.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE?.replace(/\/$/, '') || 'http://localhost:8829';
const LOGIN_URL = `${API_BASE}/api/auth/login`;
const ADMIN_REVIEWS_URL = `${API_BASE}/api/admin/reviews`;

async function login(identifier, password) {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function fetchAdminReviews(token) {
  const response = await fetch(ADMIN_REVIEWS_URL, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function main() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('Updating password for:', admin.email);
    const newPassword = process.env.NEW_ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: admin.id }, data: { password: hash } });
    console.log('✅ Password updated');
    console.log('New password:', newPassword);

    const { response: loginResponse, payload: loginPayload } = await login(admin.email, newPassword);
    console.log('\nLogin status:', loginResponse.status);
    console.log('Login payload:', JSON.stringify(loginPayload, null, 2));

    if (!loginResponse.ok || !loginPayload?.accessToken) {
      console.log('❌ Login failed after password reset');
      return;
    }

    const { response: reviewsResponse, payload: reviewsPayload } = await fetchAdminReviews(loginPayload.accessToken);
    console.log('\nAdmin reviews status:', reviewsResponse.status);
    console.log('Admin reviews payload:', JSON.stringify(reviewsPayload, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();