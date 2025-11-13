import { useEffect } from 'react';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import { t } from '../../utils/i18n';

export const useHeroSwiper = () => {
  useEffect(() => {
    // تأخير إنشاء الـ swiper قليلاً للتأكد من تحميل DOM
    const timer = setTimeout(() => {
      const swiper = new Swiper('.slide-swp', {
        modules: [Pagination, Autoplay],
        pagination: {
          el: '.swiper-pagination',
          dynamicBullets: true,
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false, // الحفاظ على التحريك حتى بعد التفاعل
          pauseOnMouseEnter: true, // إيقاف التحريك عند التمرير بالفأرة
        },
        loop: true,
        effect: 'slide',
        speed: 1000,
        grabCursor: true,
        slidesPerView: 1,
        spaceBetween: 0,
        centeredSlides: true,
        autoplayDisableOnInteraction: false, // عدم إيقاف التحريك عند التفاعل
        // إضافة إعدادات إضافية لضمان الاستمرارية
        observer: true, // مراقبة التغييرات في DOM
        observeParents: true, // مراقبة التغييرات في العناصر الأب
      });

      // حفظ مرجع الـ swiper لإمكانية الوصول إليه لاحقاً
      window.heroSwiper = swiper;

      return () => {
        if (swiper) {
          swiper.destroy();
        }
        if (window.heroSwiper) {
          delete window.heroSwiper;
        }
      };
    }, 100); // تأخير 100ms

    return () => {
      clearTimeout(timer);
    };
  }, []);
};




