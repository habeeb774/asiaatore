import prisma from '../server/db/client.js';

async function testCreateAd() {
  try {
    const newAd = await prisma.ad.create({
      data: {
        title: 'عرض الصيف',
        description: 'خصومات تصل إلى 50٪ على جميع المنتجات',
        image: '/images/summer-sale.jpg',
        link: '/offers',
        active: true
      }
    });
    console.log('تم إضافة الإعلان بنجاح:', newAd);
  } catch (error) {
    console.error('حدث خطأ أثناء إضافة الإعلان:', error);
  }
}

// تنفيذ الدالة
testCreateAd();
