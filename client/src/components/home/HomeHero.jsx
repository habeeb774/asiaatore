import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';

// Lightweight, memoized image with lazy loading
const OptimizedImage = React.memo(({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`${className} bg-gray-200 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setIsLoaded(true)} className="w-full h-full object-cover" />
    </div>
  );
});

// Slide body content (texts and CTAs)
const SlideContent = React.memo(({ slide, locale, t }) => (
  <motion.div key={slide.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/30">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      {t('saleBadge')}
    </motion.div>
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
      <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{slide.title}</span>
    </h1>
    <p className="text-xl sm:text-2xl md:text-3xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">{slide.subtitle}</p>
    <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
      <a href="/products" className="inline-flex items-center justify-center bg-transparent text-white border-2 border-white/50 px-8 py-4 rounded-lg font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white transition-all duration-300 min-w-[200px]">{locale==='ar'?'تسوق الآن':'Shop Now'}</a>
      <a href="/about" className="inline-flex items-center justify-center bg-transparent text-white border-2 border-white/50 px-8 py-4 rounded-lg font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white transition-all duration-300 min-w-[200px]">{locale==='ar'?'تعرف علينا':'About Us'}</a>
    </motion.div>
  </motion.div>
));

// Background slide (only active is displayed)
const Slide = React.memo(({ slide, isActive }) => (
  <motion.div key={slide.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.05 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.7, ease: 'easeInOut' }} className="absolute inset-0 w-full h-full" style={{ display: isActive ? 'block' : 'none' }}>
    <OptimizedImage src={slide.src} alt={slide.title} className="w-full h-full" />
    <div className="absolute inset-0" style={{ background: slide.overlay }} />
    <div className="absolute inset-0 bg-black/20" />
  </motion.div>
));

const HomeHero = () => {
  const { locale, t } = useLanguage();
  const { setting } = useSettings();

  const baseProductsPath = '/products';
  const slidesData = useMemo(() => [
    { id: 1, src: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'عروض خاصة':'Special Offers', subtitle: locale==='ar'?'خصومات تصل إلى 50%':'Up to 50% Discount', link: baseProductsPath, overlay: 'linear-gradient(135deg, rgba(102,126,234,0.8) 0%, rgba(118,75,162,0.8) 100%)' },
    { id: 2, src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'أحدث المنتجات':'New Arrivals', subtitle: locale==='ar'?'اكتشف مجموعتنا الجديدة':'Discover Our New Collection', link: baseProductsPath+'?sort=newest', overlay: 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(249,115,22,0.8) 100%)' },
    { id: 3, src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=70', title: locale==='ar'?'شحن مجاني':'Free Shipping', subtitle: locale==='ar'?'لطلبات فوق 200 ريال':'For Orders Over 200 SAR', link: '/shipping-info', overlay: 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)' }
  ], [locale]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const autoPlayRef = useRef(null);
  const touchStartRef = useRef(0);
  useEffect(() => () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); }, []);

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

  const handleTouchStart = useCallback((e) => { touchStartRef.current = e.targetTouches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e) => { const end = e.changedTouches[0].clientX; const diff = touchStartRef.current - end; if (Math.abs(diff) > 50) (diff > 0 ? goToNext() : goToPrev()); }, [goToNext, goToPrev]);

  const progressKey = useRef(0);
  useEffect(() => { progressKey.current += 1; }, [currentIndex]);

  return (
    <section className="relative h-screen min-h-[520px] max-h-[800px] overflow-hidden" dir={locale==='ar'?'rtl':'ltr'} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="relative w-full h-full">
        {slidesData.map((slide, idx) => (<Slide key={slide.id} slide={slide} isActive={idx===currentIndex} />))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <AnimatePresence mode="wait">
                <SlideContent slide={slidesData[currentIndex]} locale={locale} t={t} />
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={goToPrev} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={locale==='ar'?'السابق':'Previous'}><ChevronLeft size={20} /></button>
            <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={isAutoPlaying ? (locale==='ar'?'إيقاف':'Pause') : (locale==='ar'?'تشغيل':'Play')}>{isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
            <button onClick={goToNext} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 active:scale-95" aria-label={locale==='ar'?'التالي':'Next'}><ChevronRight size={20} /></button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
            {slidesData.map((_, idx) => (<button key={idx} onClick={() => goToSlide(idx)} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${idx===currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`} aria-label={locale==='ar'?`انتقل إلى الشريحة ${idx+1}`:`Go to slide ${idx+1}`} />))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: (setting?.heroAutoplayInterval || 5000) / 1000, ease: 'linear' }} key={progressKey.current} />
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


const Home1 = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const { byLocation, features: marketingFeatures } = useMarketing() || { byLocation: { topStrip: [], homepage: [], footer: [] }, features: [] };
  const [cats, setCats] = React.useState([]);
  React.useEffect(() => {
    let mounted = true;
    api.listCategories({ withCounts: 1 }).then(r => {
      if (mounted && r?.categories) setCats(r.categories);
    }).catch(() => { });
    return () => { mounted = false; };
  }, []);

  const topCats = React.useMemo(() => {
    return mockCategories.sort((a,b)=> (b.productCount||0)-(a.productCount||0)).slice(0,6);
  }, [cats]);

  // Horizontal categories carousel refs/state
  const catsRef = React.useRef(null);
  const [catsPaused, setCatsPaused] = React.useState(false);

  const scrollNextCats = () => {
    const el = catsRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: step, behavior: 'smooth' });
  };
  const scrollPrevCats = () => {
    const el = catsRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: -step, behavior: 'smooth' });
  };

  // autoplay carousel
  React.useEffect(() => {
    if (catsPaused) return;
    const id = setInterval(() => {
      scrollNextCats();
    }, 3000);
    return () => clearInterval(id);
  }, [catsPaused]);

  const baseProductsPath = '/products';

  const featuredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p.oldPrice).slice(0, 6);
  }, [products]);

  const latestProducts = useMemo(() => (products || []).slice(-6).reverse(), [products]);

  const features = useMemo(() => {
    return [
      { icon: <Truck className="w-8 h-8" />, title: t('featureFreeShippingTitle'), description: t('featureFreeShippingDesc') },
      { icon: <Shield className="w-8 h-8" />, title: t('featureQualityTitle'), description: t('featureQualityDesc') },
      { icon: <Clock className="w-8 h-8" />, title: t('featureFastDeliveryTitle'), description: t('featureFastDeliveryDesc') }
    ];
  }, [t]);

  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `${t('home')} | ${siteName}` : `${siteName} | ${t('home')}`;
  const pageDesc = t('heroLead');

  return (
    <div className="home-page-wrapper text-black dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <Seo title={pageTitle} description={pageDesc} />
      
      <HomeHero />

      <div className="backdrop-blur-sm bg-white/75 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="container-custom py-3 mx-auto">
          <CategoryChips />
        </div>
      </div>
      
      <section className="home-features section-padding bg-gray-50 dark:bg-black" aria-label="store features">
        <div className="container-custom mx-auto">
          <ul className="home-features__grid">
            {features.map((feature, index) => (
              <motion.li key={feature.title} className="home-feature bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-6 text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, delay: index * 0.08 }}>
                <span className="home-feature__icon text-red-500 inline-block mb-4">{feature.icon}</span>
                <h3 className="home-feature__title font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">{feature.title}</h3>
                <p className="home-feature__text text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
      
     

      <BrandsStrip />

      <section className="home-products section-padding bg-gray-50 dark:bg-black" aria-labelledby="featured-heading">
        <div className="container-custom mx-auto">
          <div className="home-section-head text-center">
            <h2 id="featured-heading" className="home-section-head__title">{t('featuredProducts')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-live="polite">
            {featuredProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: i * 0.06 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to={baseProductsPath} className="inline-block text-white font-bold px-8 py-3 rounded-lg transition-colors bg-[var(--color-primary)] border-none">
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </section>
      
      <section className="home-products section-padding bg-white dark:bg-gray-900" aria-labelledby="latest-heading">
        <div className="container-custom mx-auto">
          <div className="home-section-head text-center">
            <h2 id="latest-heading" className="home-section-head__title">{t('latestProducts')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-live="polite">
            {latestProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.05 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default React.memo(HomeHero);

