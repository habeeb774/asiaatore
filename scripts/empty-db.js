// scripts/empty-db.js
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function emptyDb() {
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    await prisma.auditLog.deleteMany();
    await prisma.appLink.deleteMany();
    await prisma.marketingBanner.deleteMany();
    await prisma.marketingFeature.deleteMany();
    await prisma.productTierPrice.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.category.deleteMany();
    await prisma.product.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();
    await prisma.storesetting.deleteMany();
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All data deleted successfully.');
  } catch (e) {
    console.error('Error deleting data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

emptyDb();
