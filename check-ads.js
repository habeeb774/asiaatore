import prisma from './server/db/client.js';

async function main() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected.');

    console.log('Querying ads...');
    const ads = await prisma.ad.findMany();
    console.log('Ads found:', ads);
  } catch (e) {
    console.error('Error querying ads:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
