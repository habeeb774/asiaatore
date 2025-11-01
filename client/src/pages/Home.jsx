import React, { useMemo, useState, useEffect, Suspense, lazy, startTransition, useDeferredValue, useRef } from 'react';
// import { motion, AnimatePresence } from '../lib/framerLazy'; // not used here; keep Home lightweight
import ProductCard, { ProductCardSkeleton } from '../components/shared/ProductCard';
import CategoryChips from '../components/CategoryChips';
import Seo from '../components/Seo';
import HomeHero from '../components/home/HomeHero';
// Lazy-load heavier, non-critical components to avoid main-thread work during initial load
const CategoriesSection = lazy(() => import('../components/home/CategoriesSection'));
const ProductSlider = lazy(() => import('../components/products/ProductSlider'));
const HomeFeatures = lazy(() => import('../components/home/HomeFeatures'));
const BrandsStrip = lazy(() => import('../components/home/BrandsStrip'));
const Offers = lazy(() => import('./Offers'));
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import { useMarketing } from '../context/MarketingContext';
import { resolveLocalized } from '../utils/locale';
import api from '../api/client';
import '../styles/HomePage.scss';
import '../styles/Hero.scss';

// Mount children only when they enter the viewport (with graceful fallback)
function ViewportGate({ children, fallback = null, rootMargin = '200px' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (visible) return; // already revealed
    const el = ref.current;
    if (!el) return;
    try {
      if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          const e = entries[0];
          if (e?.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }, { rootMargin });
        obs.observe(el);
        return () => obs.disconnect();
      }
    } catch {}
    // Fallback: reveal after short delay
    const id = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(id);
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}

const Home = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const deferredProducts = useDeferredValue(products || []);
  const { features: marketingFeatures, byLocation } = useMarketing() || { byLocation:{ topStrip:[], homepage:[], footer:[]}, features:[] };
  const [cats, setCats] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  // Defer heavy UI (product sliders, feature lists) until after initial paint/idle
  const [deferRender, setDeferRender] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined') {
      const schedule = () => {
        // Mark this update as non-urgent so React can yield to user interactions
        try {
          startTransition(() => { if (mounted) setDeferRender(true); });
        } catch (e) {
          if (mounted) setDeferRender(true);
        }
      };

      try {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(schedule, { timeout: 1000 });
        } else {
          const id = setTimeout(schedule, 700);
          return () => clearTimeout(id);
        }
      } catch (e) {
        const id = setTimeout(schedule, 700);
        return () => clearTimeout(id);
      }
    }
    return () => { mounted = false; };
  }, []);

  useEffect(()=>{
    let mounted = true;
    api.listCategories({ withCounts: 1 }).then(r => {
      if (mounted && r?.categories) setCats(r.categories);
    }).catch(()=>{});
    return ()=>{ mounted = false; };
  }, []);

  const topCats = useMemo(()=>{
    const uniq = new Map();
    for (const c of cats) { const k = c.slug||c.id; if (!uniq.has(k)) uniq.set(k, c); }
    return Array.from(uniq.values()).sort((a,b)=> (b.productCount||0)-(a.productCount||0)).slice(0,8);
  },[cats]);

  // Featured products: derive from loaded products instead of treating a page component as data
  const latestProducts = useMemo(()=> (deferredProducts || []).slice(-6).reverse(), [deferredProducts]);
  const DiscountedSlider = useMemo(()=> (deferredProducts || []).filter(p => p.oldPrice && p.oldPrice > p.price).slice(0,6), [deferredProducts]);
  // Pass a small, stable slice to sliders to reduce prop churn and mount work
  const sliderProducts = useMemo(()=> (deferredProducts || []).slice(0,12), [deferredProducts]);

  const siteName = locale==='ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale==='ar' ? `${t('home')} | ${siteName}` : `${siteName} | ${t('home')}`;

  const features = useMemo(()=> marketingFeatures?.slice(0,6).map(f => ({
    id: f.id,
    icon: <span className="text-3xl" aria-hidden="true">{f.icon}</span>,
    title: resolveLocalized(f.title, locale) || f.title,
    description: resolveLocalized(f.body, locale) || f.body
  })) || [], [marketingFeatures, locale]);

  return (
    <div className="home-page-wrapper min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Seo title={pageTitle} description={t('heroLead')} />

      {byLocation.topStrip?.length > 0 && (
        <div className="top-strip bg-emerald-600 text-white text-sm">
          <div className="container-custom flex justify-center gap-4 py-2 overflow-x-auto">
            {byLocation.topStrip.slice(0,3).map(b=>(
              <a key={b.id} href={b.linkUrl||'#'} className="inline-flex items-center gap-2 hover:opacity-90 transition truncate">
                {b.image && <img src={b.image} alt={resolveLocalized(b.title,locale)} loading="lazy" className="h-8 w-auto rounded-md object-cover" />}
                <span className="font-medium truncate max-w-xs">{resolveLocalized(b.title,locale)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <HomeHero siteName={siteName} locale={locale} t={t} />

      <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom py-3">
          <CategoryChips />
        </div>
      </div>

      {deferRender ? (
        <>
          <Suspense fallback={<div className="container-custom py-8"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" /></div>}>
            <ViewportGate fallback={<div className="container-custom py-8"><div className="h-24 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse" /></div>}>
              <HomeFeatures features={features} />
            </ViewportGate>
          </Suspense>

          <div className="home-sections w-full overflow-hidden">
            {/* تصفح حسب ال */}
            <section className="relative bg-gradient-to-b from-emerald-50 to-white py-12 md:py-16">
              <div className="container mx-auto px-4 sm:px-4 lg:px-6">
                <div className="-mt-8 md:-mt-14">
                  <Suspense fallback={<div className="h-20 bg-white/60 dark:bg-gray-800/60 rounded-lg animate-pulse" />}> 
                    <ViewportGate fallback={<div className="h-20 bg-white/60 dark:bg-gray-800/60 rounded-lg animate-pulse" />}>
                      <CategoriesSection
                        categories={topCats}
                        title={locale === 'ar' ? 'الاقسام' : 'Categories'}
                        selected={selectedCat}
                        onSelect={(slug) => setSelectedCat(slug)}
                      />
                    </ViewportGate>
                  </Suspense>
                </div>
              </div>
            </section>

            {/* المنتجات المميزة */}
            <section className="relative py-12 md:py-16 bg-gradient-to-t from-white to-emerald-50">
              <div className="container mx-auto px-2 sm:px-4 lg:px-8">
                <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse" />)}
                </div>}>
                  <ViewportGate fallback={<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse" />)}
                  </div>}>
                    <ProductSlider
                      products={sliderProducts}
                      title={locale === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
                      limit={12}
                    />
                  </ViewportGate>
                </Suspense>
              </div>
            </section>
          </div>

          <Suspense fallback={<div className="container-custom py-6"><div className="h-10 bg-white dark:bg-gray-800 rounded-lg animate-pulse" /></div>}>
            <ViewportGate fallback={<div className="container-custom py-6"><div className="h-10 bg-white dark:bg-gray-800 rounded-lg animate-pulse" /></div>}>
              <BrandsStrip />
            </ViewportGate>
          </Suspense>

          <Suspense fallback={<div className="container-custom py-8"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" /></div>}>
            <ViewportGate fallback={<div className="container-custom py-8"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" /></div>}>
              <Offers products={DiscountedSlider} />
            </ViewportGate>
          </Suspense>

          <section className="home-products section-padding bg-white dark:bg-gray-900">
            <div className="container-fixed">
              <h2 className="text-2xl font-bold mb-4 text-center">{t('latestProducts')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />) : latestProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="container-custom py-8">
          <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse" />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
