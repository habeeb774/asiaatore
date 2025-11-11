
import React, { useEffect, useState, useCallback } from 'react';
import LazyImage from './common/LazyImage';
import api from '../services/api/client';
import { useLanguage } from '../stores/LanguageContext';
import { listAds } from '../services/api/ads';
import Carousel from './ui/Carousel';

const AUTO_INTERVAL = 5000;

const HeroBannerSlider = () => {
  const { locale } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await listAds();
      if (Array.isArray(response)) {
        setBanners(response);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Preload the first banner image to help LCP when available
  useEffect(() => {
    try {
      const first = banners && banners[0];
      const img = first?.imageUrl || first?.image;
      if (img) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        return () => { try { document.head.removeChild(link); } catch {} };
      }
    } catch {
      // ignore
    }
  }, [banners]);

  // autoplay is handled by the shared Carousel component below

  if (loading) {
    return <div className="w-full h-[300px] bg-gray-200 animate-pulse rounded-2xl" />;
  }

  const currentBanner = banners[current];

  // manual navigation handled inline by the Carousel/dots; helper functions removed (unused)

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[300px] md:h-[450px] lg:h-[550px]">
      <Carousel
        items={banners}
        index={current}
        onIndexChange={setCurrent}
        renderItem={(banner) => (
          <div
            className={`w-full h-full flex items-center justify-center bg-black/5 cursor-pointer transition-all duration-300`}
            onClick={() => {
              try { if (banner?.id) api.marketingTrack({ event: 'click', bannerId: banner.id, location: 'hero' }).catch(()=>{}); } catch {}
              if (banner?.linkUrl) {
                try { window.open(banner.linkUrl, '_blank', 'noopener,noreferrer'); } catch { window.location.href = banner.linkUrl; }
              }
            }}
            role={banner?.linkUrl ? 'button' : undefined}
            tabIndex={banner?.linkUrl ? 0 : undefined}
            aria-label={banner?.title || 'Ad'}
          >
            <div style={{ width: '100%', maxWidth: '1200px', position: 'relative', paddingTop: '41.6667%' }} className="w-full">
              <LazyImage
                src={banner?.imageUrl || banner?.image || 'https://via.placeholder.com/1200x500/FFD700/fff?text=اعلان+إعلاني'}
                alt={banner?.title || 'Banner'}
                sizes="100vw"
                wrapperClassName="hero-image-wrapper"
                style={{ position: 'absolute', inset: 0 }}
                imgStyle={{ objectFit: 'cover', width: '100%', height: '100%' }}
                priority={false}
                webpSrcSet={(banner?.imageUrl || banner?.image || '').replace(/\.(jpe?g|png)$/i, '.webp')}
              />
            </div>
          </div>
        )}
        visibleCount={1}
        autoplay={true}
        interval={AUTO_INTERVAL}
        pauseOnHover={true}
        showArrows={false}
        showDots={false}
        className="group"
      />

      {/* Impression tracking: mark banner as seen when it enters the viewport */}
      <TrackImpression banners={banners} currentIndex={current} />

      {/* overlay خفيف */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[.10]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%,#fff,transparent 40%), radial-gradient(ellipse at 80% 100%,#fff,transparent 40%)',
        }}
        aria-hidden="true"
      />

      {/* النص */}
      {(currentBanner?.title_ar || currentBanner?.title_en) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="bg-black/50 rounded-xl px-4 py-3 inline-block max-w-2xl mx-auto shadow-lg">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg text-white">
              {locale === 'ar' ? (currentBanner.title_ar || currentBanner.title_en) : (currentBanner.title_en || currentBanner.title_ar)}
            </h2>
            {(currentBanner.subtitle_ar || currentBanner.subtitle_en) && (
              <p className="text-sm md:text-lg max-w-xl text-white/90">
                {locale === 'ar' ? (currentBanner.subtitle_ar || currentBanner.subtitle_en) : (currentBanner.subtitle_en || currentBanner.subtitle_ar)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* أزرار التنقل (custom) */}
      {banners.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none"
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
            tabIndex={0}
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none"
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            aria-label={locale === 'ar' ? 'التالي' : 'Next'}
            tabIndex={0}
            type="button"
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </>
      )}

      {/* مؤشرات (dots) */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-4 h-4 md:w-[25px] md:h-[25px] rounded-full border-2 ${idx === current ? 'bg-yellow-400 border-yellow-500 scale-125' : 'bg-white/60 border-white/80'} transition-all`}
              onClick={() => setCurrent(idx)}
              aria-label={locale === 'ar' ? `انتقل إلى الإعلان ${idx + 1}` : `Go to banner ${idx + 1}`}
              tabIndex={0}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBannerSlider;

// Lightweight impression tracker: posts an impression for the current banner the first time it's active
function TrackImpression({ banners = [], currentIndex = 0 }) {
  React.useEffect(() => {
    try {
      const b = banners && banners[currentIndex];
      if (b && b.id) {
        // best-effort fire-and-forget
        fetch('/api/marketing/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'impression', bannerId: b.id, location: 'hero' }) }).catch(()=>{});
      }
    } catch {
      // ignore
    }
  }, [banners, currentIndex]);
  return null;
}