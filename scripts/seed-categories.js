import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Create categories
  const categories = [
    {
      slug: 'electronics',
      nameAr: 'إلكترونيات',
      nameEn: 'Electronics',
      descriptionAr: 'أحدث الأجهزة الإلكترونية والإكسسوارات',
      descriptionEn: 'Latest electronic devices and accessories',
      image: '/images/categories/electronics.jpg'
    },
    {
      slug: 'clothing',
      nameAr: 'ملابس',
      nameEn: 'Clothing',
      descriptionAr: 'ملابس عصرية للرجال والنساء والأطفال',
      descriptionEn: 'Modern clothing for men, women, and children',
      image: '/images/categories/clothing.jpg'
    },
    {
      slug: 'books',
      nameAr: 'كتب',
      nameEn: 'Books',
      descriptionAr: 'مجموعة واسعة من الكتب والروايات',
      descriptionEn: 'Wide collection of books and novels',
      image: '/images/categories/books.jpg'
    },
    {
      slug: 'home-kitchen',
      nameAr: 'منزل ومطبخ',
      nameEn: 'Home & Kitchen',
      descriptionAr: 'أدوات وأثاث للمنزل والمطبخ',
      descriptionEn: 'Tools and furniture for home and kitchen',
      image: '/images/categories/home-kitchen.jpg'
    },
    {
      slug: 'sports',
      nameAr: 'رياضة',
      nameEn: 'Sports',
      descriptionAr: 'معدات رياضية وملابس رياضية',
      descriptionEn: 'Sports equipment and athletic wear',
      image: '/images/categories/sports.jpg'
    },
    {
      slug: 'beauty',
      nameAr: 'عناية وجمال',
      nameEn: 'Beauty & Personal Care',
      descriptionAr: 'منتجات العناية الشخصية والجمال',
      descriptionEn: 'Personal care and beauty products',
      image: '/images/categories/beauty.jpg'
    },
    {
      slug: 'toys',
      nameAr: 'ألعاب',
      nameEn: 'Toys',
      descriptionAr: 'ألعاب وترفيه للأطفال',
      descriptionEn: 'Toys and entertainment for children',
      image: '/images/categories/toys.jpg'
    },
    {
      slug: 'automotive',
      nameAr: 'سيارات',
      nameEn: 'Automotive',
      descriptionAr: 'قطع غيار وإكسسوارات السيارات',
      descriptionEn: 'Car parts and automotive accessories',
      image: '/images/categories/automotive.jpg'
    }
  ];

  for (const categoryData of categories) {
    try {
      const category = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData
      });
      console.log(`✅ Created/Updated category: ${category.nameEn}`);
    } catch (error) {
      console.error(`❌ Error creating category ${categoryData.slug}:`, error);
    }
  }

  console.log('🎉 Categories seeded successfully!');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();