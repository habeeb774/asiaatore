import React from 'react';
import { useNavigate } from 'react-router-dom';

// Lightweight Swiper import (assumes swiper is already in project)
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// Simple offers slider: fetches from /api/ads and shows cards
export default function OffersSlider({ className = '' }) {
  const [offers, setOffers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/ads');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Expect shape: { ok: true, ads: [] } or array fallback
        let list = Array.isArray(data?.ads) ? data.ads : (Array.isArray(data) ? data : []);
        // Dev-friendly fallback: if no ads in DB, show sample ads locally (do not depend on server)
        if ((!list || list.length === 0) && typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
          list = [
            {
              id: 'sample-1',
              title: 'خصم 30% على الإلكترونيات',
              description: 'أفضل العروض على السماعات والساعات الذكية لفترة محدودة',
              imageUrl: '/uploads/ads/electronics-sale.jpg',
              link: '/products?category=electronics',
            },
            {
              id: 'sample-2',
              title: 'عروض الجمعة البيضاء',
              description: 'تسوق الآن واحصل على شحن مجاني فوق 199 ريال',
              imageUrl: '/uploads/ads/white-friday.jpg',
              link: '/offers',
            },
            {
              id: 'sample-3',
              title: 'أزياء الشتاء',
              description: 'جاكيتات وأحذية بتخفيضات تصل إلى 40%',
              imageUrl: '/uploads/ads/winter-fashion.jpg',
              link: '/products?category=fashion',
            },
          ];
        }
        if (mounted) setOffers(list);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load offers');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={`w-full max-w-[1350px] mx-auto pl-0 pr-4 ${className}`}>
        <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full max-w-[1350px] mx-auto pl-0 pr-4 ${className}`}>
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-4 text-sm">
          تعذر تحميل العروض: {error}
        </div>
      </div>
    );
  }

  if (!offers.length) {
    return null;
  }

  return (
    <div className={`w-full max-w-[1350px] mx-auto pl-0 pr-4 ${className}`} dir="rtl">
      <Swiper
        slidesPerView={1}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        style={{ padding: '8px 0' }}
      >
        {offers.map((offer) => (
          <SwiperSlide key={offer.id || offer._id || offer.title}>
            <div className="group h-40 sm:h-48 md:h-56 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
              {(() => {
                const img = offer.imageUrl || offer.image || offer.pictureUrl || null;
                return img ? (
                <img
                  src={img}
                  alt={offer.title || 'عرض'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                ) : (
                <div className="w-full h-full grid place-items-center text-slate-400">
                  لا توجد صورة للعرض
                </div>
                );
              })()}

              {/* Overlay content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-3 flex flex-col justify-end">
                <div className="backdrop-blur-sm bg-white/20 dark:bg-slate-900/25 rounded-lg p-2">
                  <h3 className="m-0 text-sm font-bold text-white">
                    {offer.title || 'عرض مميز'}
                  </h3>
                  {offer.description ? (
                    <p className="m-0 text-[12px] text-white/85 line-clamp-2">
                      {offer.description}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-emerald-600 hover:bg-emerald-50"
                      onClick={() => {
                        const href = offer.link || offer.href || offer.url || '/products';
                        navigate(href);
                      }}
                    >
                      تسوق الآن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
