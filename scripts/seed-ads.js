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
      description: 'جاكيتات وأحذية بتخفيضات تصل إلى 40%'