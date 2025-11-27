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

export const useHeroSwiper = ({
  selector = '.slide-swp',
  paginationSelector = '.swiper-pagination',
  nextSelector = '.swiper-button-next',
  prevSelector = '.swiper-button-prev',
  autoplayDelay = 3500,
  enabled = true,
  showPagination = true,
  showNavigation = false
} = {}) => {
  useEffect(() => {
    if (!enabled) return;
    const el = selector ? document.querySelector(selector) : null;
    if (!el) return () => {};
    let observer;
    let destroyed = false;
    const init = async () => {
      try {
        const Swiper = await ensureSwiper();
        if (destroyed) return;
        const modules = [Autoplay];
        const config = {
          modules,
          loop: true,
          autoplay: autoplayDelay ? { delay: autoplayDelay, disableOnInteraction: false } : false
        };

              if (showPagination && paginationSelector) {
                const paginationEl = document.querySelector(paginationSelector);
                if (paginationEl) {
                  config.pagination = {
                    el: paginationEl,
                    clickable: true
                  };
                  modules.push(Pagination);
                }
        }

              if (showNavigation && nextSelector && prevSelector) {
                const nextEl = document.querySelector(nextSelector);
                const prevEl = document.querySelector(prevSelector);
                if (nextEl && prevEl) {
                  config.navigation = {
                    nextEl,
                    prevEl
                  };
                  modules.push(Navigation);
                }
        }

        const instance = new Swiper(el, config);
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
  }, [selector, paginationSelector, nextSelector, prevSelector, autoplayDelay, enabled, showPagination, showNavigation]);
};
