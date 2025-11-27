import prisma from '../server/db/client.js';

async function main() {
  // If any active product exists, skip
  const existing = await prisma.product.count({ where: { deletedAt: null } });
  if (existing > 0) {
    console.log(`Products already exist (count=${existing}). Skipping new product seed.`);
    return;
  }

  const product = await prisma.product.create({
    data: {
      slug: `new-product-${Date.now()}`,
      nameAr: 'منتج جديد مميز',
      nameEn: 'Featured New Product',
      shortAr: 'وصف مختصر للمنتج الجديد',
      shortEn: 'Short description for the new product',
      category: 'general',
      price: 149.99,
      oldPrice: 199.99,
      image: '/uploads/product-images/sample-new-product.jpg',
      stock: 25,
      status: 'active'
    }
  });

  console.log('Seeded new product:', product.id, product.slug);
}

main()
  .catch((err) => {
    console.error('Failed to seed new product:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch {}
  });
