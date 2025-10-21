import prisma from '../server/db/client.js';

async function listAds() {
  const ads = await prisma.ad.findMany();
  if (ads.length === 0) {
    console.log('لا توجد إعلانات بعد.');
  } else {
    console.log('الإعلانات الموجودة:');
    console.log(ads);
  }
  await prisma.$disconnect();
}

listAds();
