import React, {
  useMemo,
  useState,
  useEffect,
  Suspense,
  lazy,
  startTransition,
  useDeferredValue
} from 'react';

// 🧱 مكونات خفيفة تُحمّل مباشرة
import ProductCard, { ProductCardSkeleton } from '../components/shared/ProductCard';
const CategoryChips = lazy(() => import('../components/CategoryChips'));
import Seo from '../components/Seo';
import HomeHero from '../components/home/HomeHero';
import ViewportGate from '../components/shared/ViewportGate';
import TitledSection from '../components/shared/TitledSection';

// 💤 مكونات ثقيلة تُحمّل لاحقًا بشكل Lazy (Code Splitting)
const ProductSlider = lazy(() => import('../components/products/ProductSlider'));
const HomeFeatures = lazy(() => import('../components/home/HomeFeatures'));
const BrandsStrip = lazy(() => import('../components/home/BrandsStrip'));
const Offers = lazy(() => import('./Offers'));

// 🧠 السياقات
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import { useMarketing } from '../context/MarketingContext';

// ⚙️ أدوات مساعدة
import { resolveLocalized } from '../utils/locale';
// لا حاجة لاستدعاء API مباشر هنا؛ المكونات الداخلية تتكفل بجلب البيانات

// 🎨 الأنماط
// Styles consolidated into `styles/index.scss`

const Home = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const deferredProducts = useDeferredValue(products || []);
  const { features: marketingFeatures, byLocation } = useMarketing() || { byLocation:{ topStrip:[], homepage:[], footer:[]}, features:[] };
  
  // 🧩 الحالة المحلية
  const [deferRender, setDeferRender] = useState(false); // تأجيل العناصر الثقيلة
  const [Motion, setMotion] = useState(null);

  // 🎯 تفعيل التأجيل بعد أول عرض للصفحة
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const schedule = () => {
      // استخدام startTransition داخل try/catch للحفاظ على استقرار React 18
      try {
        startTransition(() => {
          if (mounted) setDeferRender(true);
        });
      } catch {
        if (mounted) setDeferRender(true);
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(schedule, { timeout: 1000 });
        return () => {
          mounted = false;
          window.cancelIdleCallback?.(idleId);
        };
      } else {
        timeoutId = setTimeout(schedule, 700);
      }
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // أزلنا جلب التصنيفات هنا لتفادي الاستدعاءات الزائدة؛ مكوّن CategoryChips يتكفل بجلبها عند ظهوره

  const latestProducts = useMemo(
    () => (deferredProducts || []).slice(-6).reverse(),
    [deferredProducts]
  );

  const DiscountedSlider = useMemo(
    () => (deferredProducts || [])
      .filter((p) => p.oldPrice && p.oldPrice > p.price)
      .slice(0, 6),
    [deferredProducts]
  );

  const sliderProducts = useMemo(
    () => (deferredProducts || []).slice(0, 12),
    [deferredProducts]
  );

  // 🌍 إعداد البيانات المحلية (الاسم والعنوان)
  const siteName =
    locale === 'ar'
      ? setting?.siteNameAr || 'شركة منفذ اسيا التجارية'
      : setting?.siteNameEn || 'My Store';

  const pageTitle =
    locale === 'ar' ? `${t('home')} | ${siteName}` : `${siteName} | ${t('home')}`;

  const features = useMemo(
    () =>
      marketingFeatures?.slice(0, 6).map((f) => ({
        id: f.id,
        icon: <span className="text-3xl" aria-hidden="true">{f.icon}</span>,
        title: resolveLocalized(f.title, locale) || f.title,
        description: resolveLocalized(f.body, locale) || f.body,
      })) || [],
    [marketingFeatures, locale]
  );

  // 🧩 التحقق من تفضيل المستخدم للحركة
  const prefersReducedMotion = useMemo(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch {
      return false;
    }
  }, []);

  // ⚙️ متغيرات الحركة (تستخدم فقط إذا تم تحميل framer-motion)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  // 🧠 تحميل framer-motion بعد التأجيل فقط (لتقليل حجم الباندل الأساسي)
  useEffect(() => {
    if (!deferRender || prefersReducedMotion) return;
    let cancelled = false;
    let idleId = null;
    let timeoutId = null;

    const load = () => {
      import('framer-motion')
        .then((m) => {
          if (cancelled) return;
          const MotionObj = m.m || m.motion;
          if (MotionObj && typeof MotionObj === 'object' && 'div' in MotionObj) {
            setMotion(MotionObj);
          } else {
            setMotion(null);
          }
        })
        .catch(() => {});
    };

    try {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(load, { timeout: 800 });
      } else {
        timeoutId = setTimeout(load, 0);
      }
    } catch {
      timeoutId = setTimeout(load, 0);
    }

    return () => {
      cancelled = true;
      try {
        if (idleId && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId);
        }
      } catch {}
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [deferRender, prefersReducedMotion]);

  // 🧩 واجهة المستخدم
  return (
    <div className="home-page-wrapper min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Seo title={pageTitle} description={t('heroLead')} />

      {/* 💡 شريط علوي تسويقي */}
      {byLocation.topStrip?.length > 0 && (
        <div className="top-strip bg-emerald-600 text-white text-sm">
          <div className="container-custom flex justify-center gap-4 py-2 overflow-x-auto">
            {byLocation.topStrip.slice(0, 3).map((b) => {
              const href = b.linkUrl || '#';
              const isExternal = typeof href === 'string' && /^(https?:)?\/\//i.test(href) && !href.startsWith('/') ;
              return (
              <a
                key={b.id}
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 hover:opacity-90 transition truncate"
              >
                {b.image && (
                  <img
                    src={b.image}
                    alt={resolveLocalized(b.title, locale)}
                    loading="lazy"
                    className="h-8 w-auto rounded-md object-cover"
                  />
                )}
                <span className="font-medium truncate max-w-xs">
                  {resolveLocalized(b.title, locale)}
                </span>
              </a>
              );
            })}
          </div>
        </div>
      )}

      <HomeHero siteName={siteName} locale={locale} t={t} />

      {/* 🧭 شريط الفئات */}
      <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom py-3">
          <Suspense fallback={<div className="h-8 bg-white/70 dark:bg-gray-800/70 rounded-lg animate-pulse" aria-busy="true" aria-live="polite" />}>
            <CategoryChips />
          </Suspense>
        </div>
      </div>

      {/* 🔄 التحميل المتدرج للمحتوى */}
      {deferRender ? (
        <>
          {/* مميزات الصفحة */}
          <Suspense fallback={<div className="container-custom py-8 animate-pulse"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6" /></div>}>
            <ViewportGate>
              <HomeFeatures features={features} />
            </ViewportGate>
          </Suspense>

          {/* المنتجات المميزة */}
          <TitledSection
            title={locale === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
            viewAllLink="/products"
            className="bg-gradient-to-t from-white to-emerald-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
          >
            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white/80 dark:bg-gray-800 rounded-2xl shadow-md" />)}</div>}>
              <ViewportGate threshold={0.2}>
                <ProductSlider products={sliderProducts} limit={12} />
              </ViewportGate>
            </Suspense>
          </TitledSection>

          {/* الماركات */}
          <Suspense fallback={<div className="container-custom py-6"><div className="h-10 bg-white dark:bg-gray-800 rounded-lg animate-pulse" /></div>}>
            <ViewportGate>
              <BrandsStrip />
            </ViewportGate>
          </Suspense>

          {/* العروض */}
          <Suspense fallback={<div className="container-custom py-8"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" /></div>}>
            <ViewportGate>
              <Offers products={DiscountedSlider} />
            </ViewportGate>
          </Suspense>

          {/* المنتجات الأخيرة */}
          <ViewportGate>
            <TitledSection
              title={t("latestProducts")}
              viewAllLink="/products"
              className="bg-gradient-to-b from-white to-emerald-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
            >
              {Motion && Motion.div ? (
                <Motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6"
                >
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Motion.div key={i} variants={itemVariants}>
                          <ProductCardSkeleton />
                        </Motion.div>
                      ))
                    : latestProducts.length > 0
                    ? latestProducts.map((p) => (
                        <Motion.div key={p.id} variants={itemVariants}>
                          <ProductCard product={p} />
                        </Motion.div>
                      ))
                    : (
                      <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                        {t("noProductsFound")}
                      </p>
                    )}
                </Motion.div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : latestProducts.length > 0
                    ? latestProducts.map((p) => <ProductCard key={p.id} product={p} />)
                    : <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">{t("noProductsFound")}</p>}
                </div>
              )}
            </TitledSection>
          </ViewportGate>
        </>
      ) : (
        // 💨 مرحلة التحميل المبدئي (skeleton)
        <div className="container-custom py-8">
          <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Home);
