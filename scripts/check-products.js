import 'dotenv/config';
import prisma from '../server/db/client.js';

async function checkProducts() {
  const count = await prisma.product.count();
  console.log('Total products in database:', count);

  const products = await prisma.product.findMany({
    select: {
      nameEn: true,
      category: true,
      price: true,
      image: true
    },
    take: 5
  });

  console.log('Sample products:');
  products.forEach(p => console.log(`- ${p.nameEn} (${p.category}): ${p.price} SAR`));

  await prisma.$disconnect();
}

checkProducts().catch(console.error);