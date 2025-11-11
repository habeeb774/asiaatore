import 'dotenv/config';
import prisma from '../server/db/client.js';

async function addFoodProducts() {
  console.log('Adding 10 food products to database...');

  // First, ensure categories exist
  const categories = [
    { slug: 'dairy-eggs', nameAr: 'الألبان والبيض', nameEn: 'Dairy & Eggs' },
    { slug: 'fruits-vegetables', nameAr: 'الفواكه والخضروات', nameEn: 'Fruits & Vegetables' },
    { slug: 'meat-poultry', nameAr: 'اللحوم والدواجن', nameEn: 'Meat & Poultry' },
    { slug: 'bakery', nameAr: 'المخابز', nameEn: 'Bakery' },
    { slug: 'beverages', nameAr: 'المشروبات', nameEn: 'Beverages' },
    { slug: 'snacks', nameAr: 'الوجبات الخفيفة', nameEn: 'Snacks' },
    { slug: 'grains-rice', nameAr: 'الحبوب والأرز', nameEn: 'Grains & Rice' },
    { slug: 'oils-condiments', nameAr: 'الزيوت والتوابل', nameEn: 'Oils & Condiments' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameAr: cat.nameAr, nameEn: cat.nameEn },
      create: cat
    });
  }
  console.log('Categories ensured.');

  // Add brands
  const brands = [
    { slug: 'almarai', nameAr: 'المراعي', nameEn: 'Almarai' },
    { slug: 'nestle', nameAr: 'نستله', nameEn: 'Nestle' },
    { slug: 'lays', nameAr: 'لايز', nameEn: 'Lays' },
    { slug: 'coca-cola', nameAr: 'كوكا كولا', nameEn: 'Coca-Cola' },
    { slug: 'danone', nameAr: 'دانون', nameEn: 'Danone' }
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { nameAr: brand.nameAr, nameEn: brand.nameEn },
      create: brand
    });
  }
  console.log('Brands ensured.');

  // 10 Real food products with images
  const foodProducts = [
    {
      slug: 'almarai-milk-1l',
      nameAr: 'حليب المراعي كامل الدسم 1 لتر',
      nameEn: 'Almarai Full Cream Milk 1L',
      shortAr: 'حليب طازج كامل الدسم من المراعي',
      shortEn: 'Fresh full cream milk from Almarai',
      category: 'dairy-eggs',
      brandSlug: 'almarai',
      price: 8.50,
      oldPrice: 9.00,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'banana-bunch',
      nameAr: 'موز طازج - باقة',
      nameEn: 'Fresh Bananas - Bunch',
      shortAr: 'موز طازج مستورد عالي الجودة',
      shortEn: 'Fresh imported high-quality bananas',
      category: 'fruits-vegetables',
      price: 12.00,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'chicken-breast-1kg',
      nameAr: 'صدر دجاج طازج 1 كيلو',
      nameEn: 'Fresh Chicken Breast 1kg',
      shortAr: 'صدر دجاج طازج بدون عظم',
      shortEn: 'Fresh boneless chicken breast',
      category: 'meat-poultry',
      price: 28.00,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'nescafe-gold',
      nameAr: 'نسكافيه جولد 200 جرام',
      nameEn: 'Nescafe Gold 200g',
      shortAr: 'قهوة فورية فاخرة من نسكافيه',
      shortEn: 'Premium instant coffee from Nescafe',
      category: 'beverages',
      brandSlug: 'nestle',
      price: 45.00,
      oldPrice: 50.00,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'lays-classic-150g',
      nameAr: 'لايز كلاسيك 150 جرام',
      nameEn: 'Lays Classic 150g',
      shortAr: 'رقائق البطاطس الكلاسيكية',
      shortEn: 'Classic potato chips',
      category: 'snacks',
      brandSlug: 'lays',
      price: 6.50,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1566479179814-8463c611b83b?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'tomatoes-1kg',
      nameAr: 'طماطم طازجة 1 كيلو',
      nameEn: 'Fresh Tomatoes 1kg',
      shortAr: 'طماطم حمراء طازجة محلية',
      shortEn: 'Fresh red local tomatoes',
      category: 'fruits-vegetables',
      price: 4.50,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1546470427-e9b9b4db0f2a?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'coca-cola-2l',
      nameAr: 'كوكا كولا 2 لتر',
      nameEn: 'Coca-Cola 2L',
      shortAr: 'مشروب غازي كلاسيكي',
      shortEn: 'Classic carbonated drink',
      category: 'beverages',
      brandSlug: 'coca-cola',
      price: 7.00,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'basmati-rice-5kg',
      nameAr: 'أرز بسمتي 5 كيلو',
      nameEn: 'Basmati Rice 5kg',
      shortAr: 'أرز بسمتي فاخر مستورد',
      shortEn: 'Premium imported basmati rice',
      category: 'grains-rice',
      price: 55.00,
      oldPrice: 60.00,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'danone-yogurt-1kg',
      nameAr: 'زبادي دانون 1 كيلو',
      nameEn: 'Danone Yogurt 1kg',
      shortAr: 'زبادي طبيعي من دانون',
      shortEn: 'Natural yogurt from Danone',
      category: 'dairy-eggs',
      brandSlug: 'danone',
      price: 12.00,
      stock: 28,
      image: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=800&q=80'
    },
    {
      slug: 'olive-oil-500ml',
      nameAr: 'زيت زيتون بكر 500 مل',
      nameEn: 'Extra Virgin Olive Oil 500ml',
      shortAr: 'زيت زيتون بكر ممتاز الجودة',
      shortEn: 'Premium extra virgin olive oil',
      category: 'oils-condiments',
      price: 35.00,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const product of foodProducts) {
    // Get brand ID if brandSlug is provided
    let brandId = null;
    if (product.brandSlug) {
      const brand = await prisma.brand.findUnique({
        where: { slug: product.brandSlug }
      });
      brandId = brand?.id || null;
    }

    // Create or update product
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        shortAr: product.shortAr,
        shortEn: product.shortEn,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        image: product.image,
        brandId: brandId
      },
      create: {
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        shortAr: product.shortAr,
        shortEn: product.shortEn,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        image: product.image,
        brandId: brandId,
        rating: 4,
        status: 'active'
      }
    });

    // Add product images
    const imageCount = await prisma.productImage.count({
      where: { productId: createdProduct.id }
    });

    if (imageCount === 0) {
      await prisma.productImage.createMany({
        data: [
          {
            productId: createdProduct.id,
            url: product.image,
            altAr: product.nameAr,
            altEn: product.nameEn,
            sort: 0
          },
          {
            productId: createdProduct.id,
            url: product.image.replace('w=800', 'w=400'),
            altAr: product.nameAr,
            altEn: product.nameEn,
            sort: 1
          }
        ]
      });
    }

    console.log(`Added product: ${product.nameEn}`);
  }

  console.log('Successfully added 10 food products with images!');
}

addFoodProducts()
  .catch(e => {
    console.error('Error adding food products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });