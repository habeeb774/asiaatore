
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { listAds } from '../api/ads';

const AUTO_INTERVAL = 5000;

const HeroBannerSlider = () => {
  const { locale } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const [paused, setPaused] = useState(false);

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

  useEffect(() => {
    if (banners.length > 1 && !paused) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, AUTO_INTERVAL);
    }
    return () => clearInterval(intervalRef.current);
  }, [banners, paused]);

  if (loading) {
    return <div className="w-full h-[300px] bg-gray-200 animate-pulse rounded-2xl" />;
  }

  const currentBanner = banners[current];

  // التنقل اليدوي
  const goTo = (idx) => setCurrent(idx);
  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  // دعم الضغط على الإعلان
  const handleBannerClick = () => {
    if (currentBanner?.linkUrl) {
      window.open(currentBanner.linkUrl, '_blank', 'noopener');
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl h-[300px] md:h-[450px] lg:h-[550px] group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* صورة الإعلان */}
      <div
        className={`w-full h-full flex items-center justify-center bg-black/5 cursor-pointer transition-all duration-300`}
        onClick={handleBannerClick}
        role={currentBanner?.linkUrl ? 'button' : undefined}
        tabIndex={currentBanner?.linkUrl ? 0 : undefined}
        aria-label={currentBanner?.title || 'Ad'}
      >
        <img
          src={currentBanner?.imageUrl || currentBanner?.image || 'https://via.placeholder.com/1200x500/FFD700/fff?text=اعلان+إعلاني'}
          alt={currentBanner?.title || 'Banner'}
          className="max-w-full max-h-full object-contain transition-all duration-700 ease-in-out drop-shadow-xl"
          loading="lazy"
        />
      </div>

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

      {/* أزرار التنقل */}
      {banners.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none"
            onClick={prev}
            aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
            tabIndex={0}
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none"
            onClick={next}
            aria-label={locale === 'ar' ? 'التالي' : 'Next'}
            tabIndex={0}
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </>
      )}

      {/* مؤشرات (dots) */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full border-2 ${idx === current ? 'bg-yellow-400 border-yellow-500 scale-125' : 'bg-white/60 border-white/80'} transition-all`}
              onClick={() => goTo(idx)}
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