import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useLanguage } from '../../stores/LanguageContext';
import { useSettings } from '../../stores/SettingsContext';
import { useExperiments } from '../../stores/ExperimentContext';
import { useAds } from '../../hooks/useAds';
import { ButtonLink } from '../ui';
import { trackEvent } from '../../lib/analytics';

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
const SlideContent = React.memo(({ slide, locale, t, ctaVariant, currentIndex, ctaClass, onCtaClick }) => {
  if (!slide) return null;
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      {/* Enhanced badge with animation */}
      {t && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20 shadow-lg"
        >
          <motion.span
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {slide.badge || t('saleBadge')}
        </motion.div>
      )}

      {/* Enhanced primary heading with staggered animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
          <motion.span
            className="block text-white drop-shadow-2xl"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {slide.title}
          </motion.span>
        </h1>
      </motion.div>

      {/* Enhanced offer/value line */}
      {slide.subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-lg sm:text-2xl md:text-3xl text-white/95 font-medium max-w-3xl mx-auto leading-snug drop-shadow-lg"
        >
          {slide.subtitle}
        </motion.p>
      )}

      {/* Enhanced CTA with better animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="mt-8"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ButtonLink
            href={slide.link || '/products'}
            variant="primary"
            onClick={() => { onCtaClick?.(slide, currentIndex); }}
            className={ctaClass}
            aria-label={locale==='ar' ? (ctaVariant==='B' ? 'اكتشف العروض' : 'تسوّق الآن') : (ctaVariant==='B' ? 'Explore Deals' : 'Shop Now')}
          >
            <motion.span
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {locale==='ar' ? (ctaVariant==='B' ? 'اكتشف العروض' : 'تسوّق الآن') : (ctaVariant==='B' ? 'Explore Deals' : 'Shop Now')}
            </motion.span>
          </ButtonLink>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

// Background slide (animated in/out)
const Slide = React.memo(({ slide }) => (
  <div className="absolute inset-0 w-full h-full">
    {/* Enhanced base background layer */}
    {slide.baseBg && (
      typeof slide.baseBg === 'string' && slide.baseBg.trim().startsWith('linear-gradient') ? (
        <motion.div
          className="absolute inset-0 z-0"
          style={{ background: slide.baseBg }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ) : (
        <motion.div
          className="absolute inset-0 z-0 w-full h-full"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <OptimizedImage src={slide.baseBg} alt={slide.title ? `${slide.title} background` : 'hero base'} className="w-full h-full" loading={'eager'} />
        </motion.div>
      )
    )}

    {/* Enhanced overlay with animation */}
    {slide.overlay && slide.overlay !== 'transparent' && (
      <motion.div
        className="absolute inset-0 z-5"
        style={{ background: slide.overlay }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    )}

    {/* Enhanced image with better animations */}
    <motion.div
      className="relative z-10 w-full h-full"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
    >
      <OptimizedImage
        src={slide.src}
        alt={slide.title}
        className="w-full h-full object-cover transition-all duration-1000 hover:scale-105"
        placeholderClass={slide.isAd ? 'bg-transparent' : 'bg-gradient-to-br from-gray-200 to-gray-300'}
        loading={slide.isAd ? 'lazy' : 'eager'}
      />

      {/* Animated overlay effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut"
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: '100%',
              opacity: 0
            }}
            animate={{
              y: '-10%',
              opacity: [0, 1, 0],
              x: Math.random() * 100 + '%'
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  </div>
));

const HomeHero = ({
  slides: slidesOverride,
  forceVariant,
  disableTracking = false,
  disableAutoplay = false,
  containerClassName
} = {}) => {
  const { locale, t } = useLanguage();
  const { setting } = useSettings();
  const { variantFor } = useExperiments();

  // Use React Query hook for ads with caching
  const { data: adsData = [] } = useAds({
    enabled: !Array.isArray(slidesOverride) || slidesOverride.length === 0
  });

  // determine CTA variant for A/B testing
  const ctaVariant = useMemo(() => {
    if (forceVariant && ['A', 'B'].includes(forceVariant)) return forceVariant;
    try { return variantFor('hero_cta', ['A', 'B']) || 'A'; } catch { return 'A'; }
  }, [forceVariant, variantFor]);

  // Visual class for CTA — Variant B is high-contrast and prominent for experiments
  const ctaClass = useMemo(() => {
    return ctaVariant === 'B'
      ? 'min-w-[220px] bg-white text-gray-900 hover:bg-white/95 border border-transparent text-lg px-8 py-4 shadow-2xl rounded-full transform transition-all duration-200 hover:-translate-y-1 active:translate-y-0 ring-1 ring-white/30 flex items-center justify-center gap-2'
      : 'min-w-[220px] text-white bg-white/10 hover:bg-white/20 border border-transparent backdrop-blur-sm text-lg px-8 py-4 shadow-lg rounded-md';
  }, [ctaVariant]);

  const baseProductsPath = '/products';
  const slidesData = useMemo(() => {
    console.log('[HomeHero] Building slidesData, adsData:', adsData);
    if (Array.isArray(slidesOverride) && slidesOverride.length) {
      return slidesOverride.map((slide, idx) => ({
        id: slide.id ?? `custom-${idx}`,
        src: slide.src,
        title: slide.title,
        subtitle: slide.subtitle,
        link: slide.link || '/products',
        overlay: slide.overlay,
        baseBg: slide.baseBg,
        centerImage: slide.centerImage || null,
        isAd: !!slide.isAd
      }));
    }
    // 1) Prefer Ads as hero slides if available
    if (adsData && adsData.length) {
      console.log('[HomeHero] Using ads for slides, count:', adsData.length);
      // For ads we prefer to show them above the hero background so transparent PNGs reveal
      // the underlying hero background (from settings or the default). We therefore mark
      // slides as ads, provide a baseBg and avoid drawing an overlay on top of the base.
      const baseBgCandidate = setting?.heroBackgroundImage || setting?.heroBackgroundGradient || 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)';
      return adsData.map((ad, idx) => ({
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
    console.log('[HomeHero] No ads available, using fallback slides');
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
  }, [adsData, setting, locale, slidesOverride]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Respect reduced motion: default to paused autoplay
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isAutoPlaying, setIsAutoPlaying] = useState(!prefersReduced && !disableAutoplay);
  const [isHovering, setIsHovering] = useState(false);

  const autoPlayRef = useRef(null);
  const touchStartRef = useRef(0);
  // track which image URLs we've preloaded so we don't keep creating Image objects
  // Use a Map to implement a tiny LRU (preserve insertion order) and cap growth.
  const preloadedRef = useRef(new Map());
  const MAX_PRELOADED = 50;
  // ref mirror for isAutoPlaying to avoid stale closure in visibility handler
  const isAutoPlayingRef = useRef(null);
  useEffect(() => () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); }, []);

  // keep ref in sync with state
  useEffect(() => { isAutoPlayingRef.current = isAutoPlaying; }, [isAutoPlaying]);

  // Ensure current index is valid when slides length changes
  useEffect(() => {
    if (slidesData.length === 0) {
      // if there are no slides, ensure index is zero but avoid repeated sets
      if (currentIndex !== 0) setCurrentIndex(0);
      return;
    }
    if (currentIndex >= slidesData.length) setCurrentIndex(0);
  }, [slidesData.length, currentIndex]);

  // Preload next slide image for smoother transitions. Track preloaded URLs to avoid
  // allocating many Image objects which can grow memory if repeated rapidly.
  useEffect(() => {
    if (!slidesData.length) return;
    const nextIndex = (currentIndex + 1) % slidesData.length;
    const next = slidesData[nextIndex];
    const url = next?.src ? normalizeSrc(next.src) : null;
    if (!url) return;
    // If already preloaded, refresh its insertion order (move to end)
    if (preloadedRef.current.has(url)) {
      try {
        const v = preloadedRef.current.get(url);
        preloadedRef.current.delete(url);
        preloadedRef.current.set(url, v);
      } catch {}
      return;
    }
    const img = new Image();
    const onDone = () => {
      try {
        // add to map (as value we store timestamp)
        preloadedRef.current.set(url, Date.now());
        // if we exceed max, remove oldest entry(s)
        if (preloadedRef.current.size > MAX_PRELOADED) {
          const it = preloadedRef.current.keys();
          const oldest = it.next().value;
          if (oldest) preloadedRef.current.delete(oldest);
        }
      } catch {}
      img.onload = img.onerror = null;
    };
    img.onload = onDone;
    img.onerror = onDone;
    img.src = url;
  }, [currentIndex, slidesData]);

  // Track exposure of the currently visible hero slide for A/B analysis
  useEffect(() => {
    if (disableTracking) return;
    const slide = slidesData[currentIndex];
    if (!slide) return;
    try {
      trackEvent('hero_exposure', {
        variant: ctaVariant,
        slide_id: slide.id,
        slide_index: currentIndex,
        is_ad: !!slide.isAd,
        title: slide.title
      });
    } catch {
      // ignore tracking failures
    }
  }, [currentIndex, slidesData, ctaVariant, disableTracking]);

  const handleCtaClick = useCallback((slide, index) => {
    if (disableTracking || !slide) return;
    const payload = {
      event: 'hero_cta_click',
      variant: ctaVariant,
      slide_id: slide.id,
      slide_index: index,
      is_ad: !!slide.isAd,
      title: slide.title,
      ts: Date.now()
    };
    try {
      trackEvent('hero_cta_click', payload);
    } catch {
      // ignore primary tracking errors
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/_collect_event', JSON.stringify(payload));
      }
    } catch {
      // ignore beacon errors
    }
  }, [ctaVariant, disableTracking]);

  const goToSlide = useCallback((i) => {
    if (!slidesData.length) return;
    setCurrentIndex(i);
  }, [slidesData.length]);

  const goToNext = useCallback(() => {
    if (!slidesData.length) return;
    setCurrentIndex((p) => (p === slidesData.length - 1 ? 0 : p + 1));
  }, [slidesData.length]);

  const goToPrev = useCallback(() => {
    if (!slidesData.length) return;
    setCurrentIndex((p) => (p === 0 ? slidesData.length - 1 : p - 1));
  }, [slidesData.length]);

  useEffect(() => {
    if (disableAutoplay || !slidesData.length) {
      if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
      return;
    }
    if (!isAutoPlaying || isHovering) {
      if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
      return;
    }
    autoPlayRef.current = setInterval(goToNext, setting?.heroAutoplayInterval || 5000);
    return () => { if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; } };
  }, [disableAutoplay, isAutoPlaying, isHovering, goToNext, setting, slidesData.length]);

  useEffect(() => {
    if (disableAutoplay) {
      setIsAutoPlaying(false);
    }
  }, [disableAutoplay]);

  // Pause autoplay when tab is hidden. Use a ref mirror for isAutoPlaying to avoid
  // stale closure issues and unnecessary state flips that could create churn.
  useEffect(() => {
    const wasAutoRef = { current: null };
    const onVis = () => {
      if (document.hidden) {
        // remember current autoplay and pause
        wasAutoRef.current = isAutoPlayingRef.current;
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
      className={containerClassName || 'relative h-[300px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'}
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
        {slidesData.map((slide, idx) => (idx === currentIndex ? (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Slide key={slide.id} slide={slide} />
          </motion.div>
        ) : null))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <SlideContent
                slide={slidesData[currentIndex]}
                locale={locale}
                t={t}
                ctaVariant={ctaVariant}
                currentIndex={currentIndex}
                ctaClass={ctaClass}
                onCtaClick={handleCtaClick}
              />
              {/* Enhanced center image */}
              {slidesData[currentIndex]?.centerImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.6, type: "spring", stiffness: 200 }}
                  className="mt-8 flex justify-center"
                >
                  <motion.img
                    src={slidesData[currentIndex].centerImage}
                    alt={slidesData[currentIndex].title || ''}
                    className="max-h-48 sm:max-h-64 md:max-h-72 object-contain drop-shadow-2xl"
                    loading="lazy"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={goToPrev}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
              aria-label={locale==='ar'?'السابق':'Previous'}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={20} />
            </motion.button>
            <motion.button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
              aria-label={isAutoPlaying ? (locale==='ar'?'إيقاف':'Pause') : (locale==='ar'?'تشغيل':'Play')}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: isAutoPlaying ? 0 : 180 }}
            >
              {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
            </motion.button>
            <motion.button
              onClick={goToNext}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
              aria-label={locale==='ar'?'التالي':'Next'}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4" role="tablist" aria-label={locale==='ar'?'مؤشرات الشرائح':'Slide indicators'}>
            {slidesData.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  idx===currentIndex ? 'bg-white scale-125 shadow-lg' : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={locale==='ar'?`انتقل إلى الشريحة ${idx+1}`:`Go to slide ${idx+1}`}
                aria-current={idx===currentIndex ? 'true' : undefined}
                role="tab"
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.8 }}
                animate={idx === currentIndex ? { scale: 1.25 } : { scale: 1 }}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          {!prefersReduced && isAutoPlaying && (
            <motion.div
              className="h-full bg-white"
              style={{ animation: `progress ${setting?.heroAutoplayInterval || 5000}ms linear infinite` }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: (setting?.heroAutoplayInterval || 5000) / 1000, ease: 'linear' }}
              key={progressKey.current}
            />
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-pointer" onClick={() => window.scrollBy({ top: window.innerHeight - 200, behavior: 'smooth' })}>
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-2 sm:h-3 bg-white/70 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};
export default React.memo(HomeHero);

