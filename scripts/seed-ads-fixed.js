import prisma from '../server/db/client.js';

async function main() {
  const samples = [
    {
      title: 'خصم 30% على الإلكترونيات',
      description: 'أفضل العروض على السماعات والساعات الذكية لفترة محدودة',
      imageUrl: '/uploads/ads/electronics-sale.jpg',
      link: '/products?category=electronics',
      active: true,
    },
    {
      title: 'عروض الجمعة البيضاء',
      description: 'تسوق الآن واحصل على شحن مجاني فوق 199 ريال',
      imageUrl: '/uploads/ads/white-friday.jpg',
      link: '/offers',
      active: true,
    },
    {
      title: 'أزياء الشتاء',
      description: 'جاكيتات وأحذية بتخفيضات تصل إلى 40%',
      imageUrl: '/uploads/ads/winter-fashion.jpg',
      link: '/products?category=fashion',
      active: true,
    },
  ];

  const existing = await prisma.ad.count();
  if (existing > 0) {
    console.log(`Ads already exist (count=${existing}). Skipping seed.`);
    return;
  }

  for (const ad of samples) {
    await prisma.ad.create({ data: ad });
  }
  const count = await prisma.ad.count();
  console.log(`Seeded ads successfully. New count=${count}`);
}

main()
  .catch((err) => {
    console.error('Failed to seed ads:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch {}
  });
