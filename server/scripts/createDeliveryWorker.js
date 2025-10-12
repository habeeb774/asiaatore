#!/usr/bin/env node
// Script to create a delivery worker profile for a user
// Usage: node server/scripts/createDeliveryWorker.js <userId> [vehicleType]

import prisma from '../db/client.js';

async function main() {
  const userId = process.argv[2];
  const vehicleType = process.argv[3] || 'motorcycle';

  if (!userId) {
    console.error('Usage: node server/scripts/createDeliveryWorker.js <userId> [vehicleType]');
    console.error('Example: node server/scripts/createDeliveryWorker.js user123 motorcycle');
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      process.exit(1);
    }

    // Check if worker profile already exists
    const existing = await prisma.deliveryWorker.findUnique({
      where: { userId }
    });

    if (existing) {
      console.log(`ℹ️  Delivery worker profile already exists for user ${user.email}`);
      console.log(`Worker ID: ${existing.id}`);
      console.log(`Status: ${existing.status}`);
      process.exit(0);
    }

    // Update user role to delivery
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'delivery' }
    });

    // Create delivery worker profile
    const worker = await prisma.deliveryWorker.create({
      data: {
        userId,
        vehicleType,
        status: 'active',
        rating: 5.0,
        totalDeliveries: 0
      }
    });

    console.log('✅ Delivery worker created successfully!');
    console.log(`Worker ID: ${worker.id}`);
    console.log(`User: ${user.email} (${user.name || 'No name'})`);
    console.log(`Vehicle Type: ${vehicleType}`);
    console.log(`Status: active`);
    console.log('');
    console.log('The user can now log in with their credentials and access /delivery dashboard');
  } catch (error) {
    console.error('❌ Error creating delivery worker:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
