import { useEffect } from 'react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Lazy load main Swiper JS; keep CSS & module imports static (safe for Vite)
let SwiperClass = null;
async function ensureSwiper() {
  if (SwiperClass) return SwiperClass;
  const mod = await import('swiper');
  SwiperClass = mod.default || mod;
  return SwiperClass;
}

export const useHeroSwiper = () => {
  useEffect(() => {
    const el = document.querySelector('.slide-swp');
    if (!el) return;
    let observer;
    let destroyed = false;
    const init = async () => {
      try {
        const Swiper = await ensureSwiper();
        if (destroyed) return;
        const instance = new Swiper(el, {
          modules: [Navigation, Pagination, Autoplay],
          loop: true,
          autoplay: { delay: 3500, disableOnInteraction: false },
          pagination: { el: document.querySelector('.swiper-pagination'), clickable: true },
          navigation: {
            nextEl: document.querySelector('.swiper-button-next'),
            prevEl: document.querySelector('.swiper-button-prev')
          }
        });
        el.__swiperInstance = instance;
      } catch {}
    };
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          init();
          break;
        }
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => {
      destroyed = true;
      try { observer && observer.disconnect(); } catch {}
      try { el.__swiperInstance && el.__swiperInstance.destroy(true, true); } catch {}
    };
  }, []);
};
