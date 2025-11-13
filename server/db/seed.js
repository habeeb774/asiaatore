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
  if (!/^mysql:\/\//i.test(url) && !/^postgres:\/\//i.test(url)) {
    throw new Error(`DATABASE_URL protocol mismatch. Expected mysql:// or postgres:// got: ${url}`);
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

  // Add 10 ready-made products with valid internet images (idempotent upsert)
  try {
    console.log('Ensuring 10 demo products (with images)...');
    const items = [
      { slug: 'catid-tea-premium', nameAr: 'شاي فاخر', nameEn: 'Premium Tea', price: 19.5, cat: 'sugar-tea-coffee' },
      { slug: 'catid-arabica-coffee', nameAr: 'قهوة أرابيكا', nameEn: 'Arabica Coffee', price: 32.0, cat: 'sugar-tea-coffee' },
      { slug: 'catid-fresh-milk-1l', nameAr: 'حليب طازج 1ل', nameEn: 'Fresh Milk 1L', price: 7.5, cat: 'dairy-eggs' },
      { slug: 'catid-free-range-eggs', nameAr: 'بيض بلدي', nameEn: 'Free-range Eggs', price: 16.0, cat: 'dairy-eggs' },
      { slug: 'catid-basmati-rice-5kg', nameAr: 'رز بسمتي 5كجم', nameEn: 'Basmati Rice 5kg', price: 58.0, cat: 'pasta-rice' },
      { slug: 'catid-penne-pasta', nameAr: 'مكرونة بيني', nameEn: 'Penne Pasta', price: 9.0, cat: 'pasta-rice' },
      { slug: 'catid-olive-oil-500ml', nameAr: 'زيت زيتون 500مل', nameEn: 'Olive Oil 500ml', price: 24.0, cat: 'oils-ghee' },
      { slug: 'catid-sunflower-oil-1l', nameAr: 'زيت دوار الشمس 1ل', nameEn: 'Sunflower Oil 1L', price: 18.0, cat: 'oils-ghee' },
      { slug: 'catid-sparkling-water', nameAr: 'ماء غازي', nameEn: 'Sparkling Water', price: 4.0, cat: 'water-beverages' },
      { slug: 'catid-orange-juice', nameAr: 'عصير برتقال', nameEn: 'Orange Juice', price: 6.5, cat: 'water-beverages' },
    ];
    // Use picsum.photos as reliable HTTP image source for tests (unique per slug)
    const imageFor = (slug) => `https://picsum.photos/seed/${encodeURIComponent(slug)}/800/600`;
    for (const p of items) {
      // Upsert product
      const prod = await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          nameAr: p.nameAr, nameEn: p.nameEn,
          price: p.price,
          category: p.cat,
          image: imageFor(p.slug),
          stock: 25
        },
        create: {
          slug: p.slug,
          nameAr: p.nameAr, nameEn: p.nameEn,
          shortAr: 'منتج للتجربة', shortEn: 'Test product',
          category: p.cat,
          price: p.price, image: imageFor(p.slug), rating: 4, stock: 25
        }
      });
      // Ensure a couple of ProductImage rows (idempotent by checking count)
      const imgCount = await prisma.productImage.count({ where: { productId: prod.id } });
      if (imgCount < 2) {
        await prisma.productImage.createMany({ data: [
          { productId: prod.id, url: imageFor(p.slug) + '?v=1', altAr: p.nameAr, altEn: p.nameEn, sort: 0 },
          { productId: prod.id, url: imageFor(p.slug) + '?v=2', altAr: p.nameAr, altEn: p.nameEn, sort: 1 },
        ] });
      }
    }
    console.log('Ensured 10 demo products with images.');
  } catch (e) {
    console.warn('Demo catId products step skipped:', e.message);
  }

  // Ensure a demo seller and assign some products to this seller (idempotent)
  try {
    const HAS_SELLER_MODEL = !!prisma.seller && typeof prisma.seller.upsert === 'function';
    const PROD_HAS_SELLER_ID = (() => {
      try {
        const mm = prisma._dmmf?.modelMap?.Product;
        return !!(mm && Array.isArray(mm.fields) && mm.fields.some(f => f.name === 'sellerId'));
      } catch { return false; }
    })();
    if (!HAS_SELLER_MODEL || !PROD_HAS_SELLER_ID) {
      console.log('Seller seeding skipped (Seller model or Product.sellerId not present in schema).');
      throw new Error('SKIP_SELLER');
    }
    const sellerEmail = 'seller@example.com';
    let sellerUser = await prisma.user.findUnique({ where: { email: sellerEmail } });
    if (!sellerUser) {
      const hashed = await bcrypt.hash('Seller123!', 10);
      sellerUser = await prisma.user.create({ data: { email: sellerEmail, password: hashed, role: 'seller', name: 'Demo Seller' } });
      console.log('Seller user created (seller@example.com / Seller123!).');
    } else if (sellerUser.role !== 'seller') {
      sellerUser = await prisma.user.update({ where: { id: sellerUser.id }, data: { role: 'seller' } });
      console.log('Existing user role elevated to seller:', sellerEmail);
    }
    const sellerProfile = await prisma.seller.upsert({
      where: { userId: sellerUser.id },
      update: { active: true },
      create: { userId: sellerUser.id, storeName: 'متجر تجريبي', commissionRate: 0.05, active: true }
    });
    // Assign a subset of products (the 10 inserted above) to this seller
    const slugsToAssign = [
      'catid-tea-premium',
      'catid-arabica-coffee',
      'catid-fresh-milk-1l',
      'catid-free-range-eggs',
      'catid-basmati-rice-5kg',
      'catid-penne-pasta',
      'catid-olive-oil-500ml',
      'catid-sunflower-oil-1l',
      'catid-sparkling-water',
      'catid-orange-juice',
    ];
    const products = await prisma.product.findMany({ where: { slug: { in: slugsToAssign } }, select: { id: true, slug: true, sellerId: true } });
    if (products.length) {
      const toUpdate = products.filter(p => p.sellerId !== sellerProfile.id);
      for (const p of toUpdate) {
        await prisma.product.update({ where: { id: p.id }, data: { sellerId: sellerProfile.id } });
      }
      if (toUpdate.length) console.log(`Assigned ${toUpdate.length} products to seller ${sellerProfile.storeName}.`);
      else console.log('Seller assignment already in place for demo products.');
    }
  } catch (e) {
    if (e && e.message === 'SKIP_SELLER') {
      console.log('Seller seeding/assignment step skipped (schema does not include Seller features).');
    } else {
      console.warn('Seller seeding/assignment step skipped:', e.message);
    }
  }

  // Store settings default (idempotent via upsert)
  // Fix legacy zero-date values that may break Prisma mappings
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE StoreSetting SET updatedAt = NOW(), createdAt = IFNULL(createdAt, NOW()) WHERE id = "singleton" AND (updatedAt IS NULL OR updatedAt = "0000-00-00 00:00:00")'
    );
  } catch { /* ignore */ }
  await prisma.storeSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteNameAr: 'شركة منفذ اسيا التجارية',
      siteNameEn: 'My Store',
      colorPrimary: '#69be3c',
      colorSecondary: '#f6ad55',
      colorAccent: '#0ea5e9',
      // sensible defaults for hero and top-strip
      logo: '/images/site-logo.svg',
      heroBackgroundImage: 'https://picsum.photos/seed/hero/1600/900',
      heroBackgroundGradient: 'linear-gradient(90deg,#69be3c 0%, #0ea5e9 100%)',
      heroCenterImage: 'https://picsum.photos/seed/hero-center/400/400',
      heroAutoplayInterval: 6000,
      topStripEnabled: true,
      topStripAutoscroll: true,
      topStripBackground: '#fde68a'
    }
  });
  console.log('Store settings ensured (singleton).');

  // Seed ads for hero carousel
  const ads = [
    {
      title: 'عرض خاص - خصم 50%',
      description: 'اكتشف أحدث العروض والخصومات',
      image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=70',
      link: '/products',
      active: true
    },
    {
      title: 'منتجات جديدة',
      description: 'اكتشف مجموعتنا الجديدة من المنتجات',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=70',
      link: '/products?sort=newest',
      active: true
    },
    {
      title: 'شحن مجاني',
      description: 'لطلبات فوق 200 ريال',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=70',
      link: '/shipping-info',
      active: true
    }
  ];

  for (const ad of ads) {
    const existing = await prisma.ad.findFirst({
      where: { title: ad.title }
    }).catch(() => null);
    
    if (!existing) {
      await prisma.ad.create({ data: ad });
      console.log(`Ad created: ${ad.title}`);
    }
  }
  console.log('Ads seeding completed.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async ()=> { await prisma.$disconnect(); });
