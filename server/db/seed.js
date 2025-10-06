import 'dotenv/config';
import prisma from './client.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL =', url);
  if (!url) {
    throw new Error('DATABASE_URL is not set. Aborting seed.');
  }
  if (!/^mysql:\/\//i.test(url)) {
    throw new Error(`DATABASE_URL protocol mismatch. Expected mysql:// got: ${url}`);
  }
  // Ensure admin user exists
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } }).catch(()=>null);
  if (!existingAdmin) {
    // Password placeholder (plaintext for now) -> In production use bcrypt hash
    const hashed = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: { email: adminEmail, password: hashed, role: 'admin', name: 'Administrator' }
    });
    console.log('Admin user created (admin@example.com / Admin123!)');
  } else {
    console.log('Admin user already exists, skipping.');
  }
  // Seed categories first (idempotent upsert)
  const canonicalCategories = [
    { slug: 'supermarket', nameAr: 'السوبرماركت', nameEn: 'Supermarket' },
    { slug: 'offers', nameAr: 'العروض', nameEn: 'Offers' },
    { slug: 'dairy-eggs', nameAr: 'الألبان والبيض', nameEn: 'Dairy & Eggs' },
    { slug: 'sugar-tea-coffee', nameAr: 'السكر والشاي والقهوة', nameEn: 'Sugar, Tea & Coffee' },
    { slug: 'water-beverages', nameAr: 'الماء والمشروبات', nameEn: 'Water & Beverages' },
    { slug: 'sweets-biscuits', nameAr: 'الحلويات والبسكويت', nameEn: 'Sweets & Biscuits' },
    { slug: 'processed', nameAr: 'المعلبات', nameEn: 'Processed' },
    { slug: 'condiments-sauces', nameAr: 'الصلصات والمخللات', nameEn: 'Condiments & Sauces' },
    { slug: 'pasta-rice', nameAr: 'المعكرونة والأرز', nameEn: 'Pasta & Rice' },
    { slug: 'oils-ghee', nameAr: 'الزيوت والسمن', nameEn: 'Oils & Ghee' },
    { slug: 'baby', nameAr: 'الطفل', nameEn: 'Baby' },
    { slug: 'personal-care', nameAr: 'العناية الشخصية', nameEn: 'Personal Care' },
    { slug: 'cleaning', nameAr: 'التنظيف', nameEn: 'Cleaning' }
  ];
  const existingCats = await prisma.category.findMany({ select: { slug: true } }).catch(()=>[]);
  const existingSet = new Set(existingCats.map(c => c.slug));
  const toInsert = canonicalCategories.filter(c => !existingSet.has(c.slug));
  if (toInsert.length > 0) {
    await prisma.category.createMany({ data: toInsert });
    console.log(`Inserted categories: ${toInsert.map(c=>c.slug).join(', ')}`);
  } else {
    console.log('All canonical categories already exist.');
  }
  const catSlugs = (await prisma.category.findMany({ select: { slug: true } })).map(c => c.slug);
  const catSlugsForAssignment = catSlugs.filter(s => s !== 'offers'); // prefer real categories for assignment

  // Basic products if none exist
  const count = await prisma.product.count();
  if (count === 0) {
    const demo = Array.from({ length: 24 }).map((_, i) => {
      const id = i + 1;
      const base = 20 + i * 3;
      const hasDiscount = i % 4 === 0;
      const cat = catSlugsForAssignment.length
        ? catSlugsForAssignment[i % catSlugsForAssignment.length]
        : 'supermarket';
      return {
        slug: `product-${id}`,
        nameAr: `منتج ${id}`,
        nameEn: `Product ${id}`,
        shortAr: 'وصف مختصر للمنتج',
        shortEn: 'Short product description',
        category: cat,
        price: base,
        oldPrice: hasDiscount ? base + 10 : null,
        image: `https://via.placeholder.com/600x400?text=P${id}`,
        rating: (i % 5) + 1,
        stock: i % 7 === 0 ? 0 : 10 + (i % 5)
      };
    });
    await prisma.product.createMany({ data: demo });
    console.log('Inserted demo products.');
  } else {
    console.log('Products already exist, skipping.');
  }

  // Ensure all existing products have a valid category slug
  try {
    const validSet = new Set(catSlugs);
    const allProducts = await prisma.product.findMany({ select: { id: true, category: true, oldPrice: true, createdAt: true } });
    const toFix = allProducts.filter(p => !p.category || !validSet.has(p.category));
    if (toFix.length > 0) {
      console.log(`Remapping categories for ${toFix.length} products to valid slugs...`);
      // Use a deterministic assignment: distribute across available categories (excluding 'offers' by default)
      const assignPool = catSlugsForAssignment.length ? catSlugsForAssignment : catSlugs;
      const updates = toFix.map((p, idx) => ({
        id: p.id,
        category: assignPool[idx % assignPool.length]
      }));
      // Batch updates in transactions to avoid too many individual queries
      const BATCH = 50;
      for (let i=0;i<updates.length;i+=BATCH) {
        const chunk = updates.slice(i, i+BATCH);
        await prisma.$transaction(chunk.map(u => prisma.product.update({ where: { id: u.id }, data: { category: u.category } })));
      }
      console.log('Product categories remapped.');
    } else {
      console.log('All products already have valid category slugs.');
    }
  } catch (e) {
    console.warn('Category remap step skipped due to error:', e.message);
  }

  // Seed brands
  const brandCount = await prisma.brand.count().catch(()=>0);
  if (brandCount === 0) {
    const brands = [
      { slug:'fresh-co', nameAr:'فريش كو', nameEn:'Fresh Co', descriptionEn:'Quality grocery essentials' },
      { slug:'gulf-foods', nameAr:'جلف فودز', nameEn:'Gulf Foods' },
      { slug:'mega-pack', nameAr:'ميجا باك', nameEn:'Mega Pack' }
    ];
    await prisma.brand.createMany({ data: brands });
    console.log('Inserted demo brands.');
    const prods = await prisma.product.findMany({ take: 12, orderBy: { createdAt: 'asc' } });
    for (let i=0;i<prods.length;i++) {
      const bSlug = brands[i % brands.length].slug;
      const b = await prisma.brand.findUnique({ where:{ slug:bSlug } });
      if (b) await prisma.product.update({ where:{ id: prods[i].id }, data:{ brandId: b.id } });
    }
  } else {
    console.log('Brands already exist, skipping.');
  }

  // Seed tier prices
  const tierCount = await prisma.productTierPrice.count().catch(()=>0);
  if (tierCount === 0) {
    const pick = await prisma.product.findMany({ take:5, orderBy:{ createdAt:'asc' } });
    for (const p of pick) {
      await prisma.productTierPrice.createMany({ data:[
        { productId:p.id, minQty:5, price: Math.max(1, p.price * 0.95), packagingType:'unit' },
        { productId:p.id, minQty:20, price: Math.max(1, p.price * 0.9), packagingType:'unit' }
      ]});
    }
    console.log('Inserted sample tier prices.');
  } else {
    console.log('Tier prices already exist, skipping.');
  }

  // Marketing features
  if (await prisma.marketingFeature.count().catch(()=>0) === 0) {
    await prisma.marketingFeature.createMany({ data:[
      { titleAr:'توصيل سريع', titleEn:'Fast Delivery', bodyAr:'شحن خلال يومين', bodyEn:'Ships within 2 days', icon:'truck', sort:0 },
      { titleAr:'دفع آمن', titleEn:'Secure Payment', bodyAr:'بوابات موثوقة', bodyEn:'Trusted gateways', icon:'shield', sort:1 },
      { titleAr:'خصومات كمية', titleEn:'Volume Discounts', bodyAr:'وفر في الشراء بالجملة', bodyEn:'Save on bulk', icon:'layers', sort:2 }
    ]});
    console.log('Inserted marketing features.');
  }

  // Marketing banners
  if (await prisma.marketingBanner.count().catch(()=>0) === 0) {
    await prisma.marketingBanner.createMany({ data:[
      { location:'topStrip', titleAr:'عرض خاص اليوم', titleEn:'Today Special Offer', bodyAr:'خصم 10% على الشحن', bodyEn:'10% off shipping', active:true, sort:0 },
      { location:'homepage', titleAr:'جديدنا', titleEn:"What's New", bodyAr:'منتجات مضافة حديثاً', bodyEn:'Recently added products', active:true, sort:1 }
    ]});
    console.log('Inserted marketing banners.');
  }

  // App links
  if (await prisma.appLink.count().catch(()=>0) === 0) {
    await prisma.appLink.createMany({ data:[
      { platform:'ios', url:'https://example.com/ios', labelEn:'iOS App', labelAr:'تطبيق iOS' },
      { platform:'android', url:'https://example.com/android', labelEn:'Android App', labelAr:'تطبيق Android' },
      { platform:'web', url:'https://example.com', labelEn:'Web Portal', labelAr:'واجهة الويب' }
    ]});
    console.log('Inserted app links.');
  }

  // Store settings default
  const existingSetting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } }).catch(()=>null);
  if (!existingSetting) {
    await prisma.storeSetting.create({ data: {
      id: 'singleton',
      siteNameAr: 'متجري',
      siteNameEn: 'My Store',
      colorPrimary: '#69be3c',
      colorSecondary: '#f6ad55',
      colorAccent: '#0ea5e9'
    }});
    console.log('Inserted default store settings.');
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async ()=> { await prisma.$disconnect(); });
