import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/client';
import { ButtonLink } from '../ui';

// Normalize upload paths (handles '/api/uploads' and bare 'uploads/...')
function normalizeSrc(src){
  if (!src) return src;
  let s = String(src);
  if (s.startsWith('/api/uploads')) s = s.replace(/^\/api/, '');
  if (s.startsWith('uploads/')) s = '/' + s;
  return s;
}

// Lightweight, memoized image with placeholder, lazy/eager loading and fetchPriority
const OptimizedImage = React.memo(({ src, alt = '', className = '', placeholderClass = 'bg-gray-200', loading = 'lazy' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const normalized = normalizeSrc(src);
  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* placeholder layer - visible until image loads */}
      <div className={`${placeholderClass} absolute inset-0 w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
      {/* actual image */}
      <img
        src={normalized}
        alt={alt}
        loading={loading}
        fetchPriority={loading === 'eager' ? 'high' : 'low'}
        decoding="async"
        className={`w-full h-full object-cover block transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
});

// Slide body content (texts and a single primary CTA)
const SlideContent = React.memo(({ slide, locale, t }) => (
  <motion.div key={slide.id} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 1.05 }} transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }} className="space-y-5">
    {/* Small badge (optional) */}
    {t && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.45, delay: 0.3 }} className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold border border-white/20">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        {slide.badge || t('saleBadge')}
      </motion.div>
    )}

    {/* Primary heading: emphasize product/category */}
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
      <span className="block text-white">{slide.title}</span>
    </h1>

    {/* Offer/value line — make this clear and prominent */}
    {slide.subtitle && (
      <p className="text-lg sm:text-2xl md:text-3xl text-white/95 font-medium max-w-3xl mx-auto leading-snug">{slide.subtitle}</p>
    )}

    {/* Single, clear primary CTA */}
    <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
      <ButtonLink
        href={slide.link || '/products'}
        variant="primary"
        className="min-w-[220px] text-white bg-white/10 hover:bg-white/20 border border-transparent backdrop-blur-sm text-lg px-8 py-4 shadow-lg"
        aria-label={locale==='ar' ? 'تسوّق الآن' : 'Shop Now'}
      >
        {locale==='ar' ? 'تسوّق الآن' : 'Shop Now'}
      </ButtonLink>
    </motion.div>
  </motion.div>
));

// Background slide (animated in/out)
const Slide = React.memo(({ slide }) => (
  <motion.div key={slide.id} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1.02 }} exit={{ opacity: 0, y: -20, scale: 1.05 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="absolute inset-0 w-full h-full">
    {/* Base background layer (can be a gradient or an image). This sits at the very back
        so transparent parts of the ad image will reveal this original hero background. */}
    {slide.baseBg && (
      typeof slide.baseBg === 'string' && slide.baseBg.trim().startsWith('linear-gradient') ? (
        <div className="absolute inset-0 z-0" style={{ background: slide.baseBg }} />
      ) : (
        <div className="absolute inset-0 z-0 w-full h-full">
          <OptimizedImage src={slide.baseBg} alt={slide.title ? `${slide.title} background` : 'hero base'} className="w-full h-full" loading={'eager'} />
        </div>
      )
    )}

    {/* Optional overlay (kept only when explicitly provided and not 'transparent') */}
    {slide.overlay && slide.overlay !== 'transparent' && (
      <div className="absolute inset-0 z-5" style={{ background: slide.overlay }} />
    )}

    {/* image on top so transparency shows the base background */}
    <div className="relative z-10 w-full h-full">
      <OptimizedImage src={slide.src} alt={slide.title} className="w-full h-full" placeholderClass={slide.isAd ? 'bg-transparent' : 'bg-gray-200'} loading={slide.isAd ? 'lazy' : 'eager'} />
    </div>
  </motion.div>
));

const HomeHero = () => {
  const { locale, t } = useLanguage();
  const { setting } = useSettings();
  const [ads, setAds] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.listAds();
        if (!mounted) return;
        const arr = Array.isArray(res) ? res : [];
        setAds(arr.filter(a => a && a.active));
      } catch {
        if (mounted) setAds([]);
      } finally {
        // no-op
      }
    })();
    return () => { mounted = false; };
  }, []);

  const baseProductsPath = '/products';
  const slidesData = useMemo(() => {
    // 1) Prefer Ads as hero slides if available
    if (ads && ads.length) {
      // For ads we prefer to show them above the hero background so transparent PNGs reveal
      // the underlying hero background (from settings or the default). We therefore mark
      // slides as ads, provide a baseBg and avoid drawing an overlay on top of the base.
      const baseBgCandidate = setting?.heroBackgroundImage || setting?.heroBackgroundGradient || 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)';
      return ads.map((ad, idx) => ({
        id: ad.id ?? `ad-${idx}`,
        src: normalizeSrc(ad.image) || 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=70',
        title: ad.title || (locale==='ar' ? 'إعلان' : 'Ad'),
        subtitle: ad.description || (locale==='ar' ? 'اكتشف المزيد' : 'Discover more'),
        link: ad.link || baseProductsPath,
        // Do not overlay ads with a dark tint — allow transparency to show baseBg
        overlay: 'transparent',
        // Provide a base background (image or gradient) so transparent areas reveal it
        baseBg: baseBgCandidate,
        // Do NOT draw the settings center image on top of ads
        centerImage: null,
        isAd: true
      }));
    }
    // 2) Otherwise, if settings-defined hero is present, use it
    if (setting?.heroBackgroundImage || setting?.heroBackgroundGradient || setting?.heroCenterImage) {
      const title = locale==='ar' ? 'تسوّق الآن' : 'Shop Now';
      const subtitle = locale==='ar' ? 'أفضل العروض والمنتجات' : 'Great offers and products';
      return [{
        id: 'setting-hero',
        src: setting.heroBackgroundImage || 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=70',
        title,
        subtitle,
        link: baseProductsPath,
        overlay: setting.heroBackgroundGradient || 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)',
        centerImage: setting.heroCenterImage || null
      }];
    }
    // 3) Fallback to default slides
    return [
      { id: 1, src: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'عروض خاصة':'Special Offers', subtitle: locale==='ar'?'خصومات تصل إلى 50%':'Up to 50% Discount', link: baseProductsPath, overlay: 'linear-gradient(135deg, rgba(102,126,234,0.8) 0%, rgba(118,75,162,0.8) 100%)' },
      { id: 2, src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'أحدث المنتجات':'New Arrivals', subtitle: locale==='ar'?'اكتشف مجموعتنا الجديدة':'Discover Our New Collection', link: baseProductsPath+'?sort=newest', overlay: 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(249,115,22,0.8) 100%)' },
      { id: 3, src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'شحن مجاني':'Free Shipping', subtitle: locale==='ar'?'لطلبات فوق 200 ريال':'For Orders Over 200 SAR', link: '/shipping-info', overlay: 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)' }
    ];
  }, [ads, setting, locale]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Respect reduced motion: default to paused autoplay
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isAutoPlaying, setIsAutoPlaying] = useState(!prefersReduced);
  const [isHovering, setIsHovering] = useState(false);

  const autoPlayRef = useRef(null);
  const touchStartRef = useRef(0);
  useEffect(() => () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); }, []);

  // Ensure current index is valid when slides length changes
  useEffect(() => {
    if (currentIndex >= slidesData.length) setCurrentIndex(0);
  }, [slidesData.length, currentIndex]);

  // Preload next slide image for smoother transitions
  useEffect(() => {
    if (!slidesData.length) return;
    const next = slidesData[(currentIndex + 1) % slidesData.length];
    if (next?.src) {
      const img = new Image();
      img.src = normalizeSrc(next.src);
    }
  }, [currentIndex, slidesData]);

  const goToSlide = useCallback((i) => setCurrentIndex(i), []);
  const goToNext = useCallback(() => setCurrentIndex((p) => (p === slidesData.length - 1 ? 0 : p + 1)), [slidesData.length]);
  const goToPrev = useCallback(() => setCurrentIndex((p) => (p === 0 ? slidesData.length - 1 : p - 1)), [slidesData.length]);

  useEffect(() => {
    if (!isAutoPlaying || isHovering) {
      if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
      return;
    }
    autoPlayRef.current = setInterval(goToNext, setting?.heroAutoplayInterval || 5000);
    return () => { if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; } };
  }, [isAutoPlaying, isHovering, goToNext, setting]);

  // Pause autoplay when tab is hidden
  useEffect(() => {
    // Pause autoplay when tab hidden, but restore previous autoplay state when visible
    const wasAutoRef = { current: null };
    const onVis = () => {
      if (document.hidden) {
        // remember current autoplay and pause
        wasAutoRef.current = isAutoPlaying;
        setIsAutoPlaying(false);
      } else {
        // restore previous autoplay only if it was enabled before hiding
        if (wasAutoRef.current) {
          setIsAutoPlaying(true);
        }
        wasAutoRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleTouchStart = useCallback((e) => { touchStartRef.current = e.targetTouches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e) => { const end = e.changedTouches[0].clientX; const diff = touchStartRef.current - end; if (Math.abs(diff) > 50) (diff > 0 ? goToNext() : goToPrev()); }, [goToNext, goToPrev]);

  const progressKey = useRef(0);
  useEffect(() => { progressKey.current += 1; }, [currentIndex]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
    if (e.key === ' ') { e.preventDefault(); setIsAutoPlaying(p => !p); }
  }, [goToPrev, goToNext]);

  return (
    <section
      className="relative h-screen min-h-[520px] max-h-[800px] overflow-hidden"
      dir={locale==='ar'?'rtl':'ltr'}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={locale==='ar' ? 'شريط شرائح رئيسية' : 'Hero carousel'}
    >
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          {slidesData.map((slide, idx) => (idx === currentIndex ? (<Slide key={slide.id} slide={slide} />) : null))}
        </AnimatePresence>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <AnimatePresence mode="wait">
                      <SlideContent slide={slidesData[currentIndex]} locale={locale} t={t} />
              </AnimatePresence>
              {/* صورة مركزية اختيارية من الإعدادات */}
                    {slidesData[currentIndex]?.centerImage && (
                      <div className="mt-8 flex justify-center">
                        <img src={slidesData[currentIndex].centerImage} alt={slidesData[currentIndex].title || ''} className="max-h-48 sm:max-h-64 md:max-h-72 object-contain drop-shadow-xl" loading="lazy" />
                      </div>
                    )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={goToPrev} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={locale==='ar'?'السابق':'Previous'}><ChevronLeft size={20} /></button>
            <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={isAutoPlaying ? (locale==='ar'?'إيقاف':'Pause') : (locale==='ar'?'تشغيل':'Play')}>{isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
            <button onClick={goToNext} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={locale==='ar'?'التالي':'Next'}><ChevronRight size={20} /></button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4" role="tablist" aria-label={locale==='ar'?'مؤشرات الشرائح':'Slide indicators'}>
            {slidesData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${idx===currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
                aria-label={locale==='ar'?`انتقل إلى الشريحة ${idx+1}`:`Go to slide ${idx+1}`}
                aria-current={idx===currentIndex ? 'true' : undefined}
                role="tab"
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          {!prefersReduced && isAutoPlaying && (
            <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: (setting?.heroAutoplayInterval || 5000) / 1000, ease: 'linear' }} key={progressKey.current} />
          )}
        </div>
      </div>
      <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-pointer" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} onClick={() => window.scrollBy({ top: window.innerHeight - 200, behavior: 'smooth' })}>
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center">
          <motion.div className="w-1 h-2 sm:h-3 bg-white/70 rounded-full mt-2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
      </motion.div>
    </section>
  );
};
export default React.memo(HomeHero);

