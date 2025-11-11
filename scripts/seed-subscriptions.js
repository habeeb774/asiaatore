import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptions() {
  console.log('🌱 Seeding subscription plans...');

  // Create subscription plans
  const plans = [
    {
      nameAr: 'أساسي',
      nameEn: 'Basic',
      descriptionAr: 'خطة مثالية للمبتدئين',
      descriptionEn: 'Perfect plan for beginners',
      price: 29.99,
      currency: 'SAR',
      interval: 'month',
      intervalCount: 1,
      trialDays: 7,
      maxUsers: 1,
      isActive: true,
      sortOrder: 1,
      features: [
        { nameAr: 'منتجات غير محدودة', nameEn: 'Unlimited products', value: 'unlimited' },
        { nameAr: 'دعم عبر البريد الإلكتروني', nameEn: 'Email support', value: 'true' },
        { nameAr: 'تقارير أساسية', nameEn: 'Basic reports', value: 'true' }
      ]
    },
    {
      nameAr: 'متقدم',
      nameEn: 'Pro',
      descriptionAr: 'للأعمال المتوسطة والمتنامية',
      descriptionEn: 'For medium and growing businesses',
      price: 79.99,
      currency: 'SAR',
      interval: 'month',
      intervalCount: 1,
      trialDays: 14,
      maxUsers: 5,
      isActive: true,
      sortOrder: 2,
      features: [
        { nameAr: 'كل مميزات الخطة الأساسية', nameEn: 'All Basic features', value: 'true' },
        { nameAr: 'دعم عبر الهاتف', nameEn: 'Phone support', value: 'true' },
        { nameAr: 'تقارير متقدمة', nameEn: 'Advanced reports', value: 'true' },
        { nameAr: 'إدارة المخزون الذكية', nameEn: 'Smart inventory', value: 'true' },
        { nameAr: 'تخصيص المتجر', nameEn: 'Store customization', value: 'true' }
      ]
    },
    {
      nameAr: 'مميز',
      nameEn: 'Premium',
      descriptionAr: 'الحل الأمثل للأعمال الكبيرة',
      descriptionEn: 'The ultimate solution for large businesses',
      price: 199.99,
      currency: 'SAR',
      interval: 'month',
      intervalCount: 1,
      trialDays: 30,
      maxUsers: 20,
      isActive: true,
      sortOrder: 3,
      features: [
        { nameAr: 'كل مميزات الخطة المتقدمة', nameEn: 'All Pro features', value: 'true' },
        { nameAr: 'دعم VIP 24/7', nameEn: '24/7 VIP support', value: 'true' },
        { nameAr: 'تحليلات متقدمة', nameEn: 'Advanced analytics', value: 'true' },
        { nameAr: 'تكامل مع أنظمة خارجية', nameEn: 'Third-party integrations', value: 'unlimited' },
        { nameAr: 'استشارات مخصصة', nameEn: 'Custom consulting', value: 'true' },
        { nameAr: 'خصم 10% على الشحن', nameEn: '10% shipping discount', value: '10' }
      ]
    }
  ];

  for (const planData of plans) {
    const { features, ...planInfo } = planData;

    const plan = await prisma.subscriptionPlan.create({
      data: planInfo
    });

    // Create features
    for (const feature of features) {
      await prisma.subscriptionFeature.create({
        data: {
          ...feature,
          planId: plan.id
        }
      });
    }

    console.log(`✅ Created plan: ${plan.nameEn}`);
  }

  console.log('🎉 Subscription plans seeded successfully!');
}

async function main() {
  try {
    await seedSubscriptions();
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();