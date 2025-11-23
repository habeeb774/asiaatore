#!/usr/bin/env node
// Creates an admin user directly in the database if one does not exist.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: passwordHash,
        name: 'System Admin',
        role: 'admin'
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('User ID:', admin.id);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();