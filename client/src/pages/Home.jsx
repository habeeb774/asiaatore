import React, { Suspense, lazy, useMemo, useEffect } from 'react';

// 🧱 مكونات خفيفة تُحمّل مباشرة
import ProductCard from '../components/shared/ProductCard';
import TopStrip from '../components/shared/TopStrip';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import DiscountedProductsSection from '../components/home/DiscountedProductsSection';
import FeaturedProductsSection from '../components/home/FeaturedProductsSection';
import CategorySection from '../components/home/CategorySection';
import StatsSection from '../components/home/StatsSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FAQSection from '../components/home/FAQSection';
import ContactSection from '../components/home/ContactSection';

// 🧠 السياقات
import { useLanguage } from '../stores/LanguageContext';
import { useProducts } from '../stores/ProductsContext';
import { useSettings } from '../stores/SettingsContext';
import { useMarketing } from '../stores/MarketingContext';

// 🎣 الـ Hooks المخصصة
import { useDeferredRender, useMotion, usePrefersReducedMotion } from '../hooks/useHomePage';
import { useHomeProducts, useMotionVariants, useProductTiles } from '../hooks/useHomeProducts';
import { useMarketingFeatures, useSiteConfig, useTopStripBanners } from '../hooks/useHomeMarketing';

// 🎨 الأنماط
// Styles consolidated into `styles/index.scss`

/**
 * Home Page Component - Main landing page with optimized performance
 *
 * Features:
 * - Lazy loading for heavy components
 * - Deferred rendering for better initial load
 * - Motion animations with reduced motion support
 * - Responsive design with viewport optimization
 * - SEO optimized with structured data
 */
const Home = () => {
  // 🧠 السياقات
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const { features: marketingFeatures, byLocation } = useMarketing() || {
    byLocation: { topStrip: [], homepage: [], footer: [] },
    features: []
  };

  // 🎣 الـ Hooks المخصصة
  const deferRender = useDeferredRender();
  const prefersReducedMotion = usePrefersReducedMotion();
  const Motion = useMotion(deferRender, prefersReducedMotion);

  // 📊 إدارة البيانات
  const { latestProducts, discountedProducts, featuredProducts } = useHomeProducts(products);
  const { containerVariants, itemVariants } = useMotionVariants();
  const features = useMarketingFeatures(marketingFeatures, locale);
  const { siteName, pageTitle } = useSiteConfig(locale, setting, t);
  const topStripBanners = useTopStripBanners(byLocation.topStrip, locale);

  // 🎨 إدارة العرض
  const productTiles = useProductTiles(latestProducts, loading, Motion, itemVariants, t, locale);

  // 📱 التحقق من حجم الشاشة
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  // 🏷️ تحديث عنوان الصفحة
  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  // 📊 البيانات المنظمة لـ SEO
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": locale === 'ar' ? "متجر إلكتروني شامل يقدم مجموعة واسعة من المنتجات" : "Comprehensive online store offering a wide range of products",
    "url": typeof window !== 'undefined' ? window.location.href : "",
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    }
  }), [pageTitle, locale, siteName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* البيانات المنظمة لـ SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* الشرائط العلوية */}
      {topStripBanners.length > 0 && (
        <TopStrip banners={topStripBanners} />
      )}

      {/* الهيدر */}
      <Header />

      {/* المحتوى الرئيسي */}
      <main className="relative">
        {/* قسم البطل */}
        <HeroSection />

        {/* المميزات */}
        {features.length > 0 && (
          <FeaturesSection features={features} Motion={Motion} containerVariants={containerVariants} />
        )}

        {/* المنتجات المميزة */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('featuredProducts')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {locale === 'ar' ? 'اكتشف أحدث منتجاتنا المميزة' : 'Discover our latest featured products'}
              </p>
            </div>

            <Motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {productTiles}
            </Motion.div>
          </div>
        </section>

        {/* المنتجات المخفضة */}
        {discountedProducts.length > 0 && (
          <DiscountedProductsSection
            products={discountedProducts}
            Motion={Motion}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            t={t}
            locale={locale}
          />
        )}

        {/* المنتجات المميزة الإضافية */}
        {featuredProducts.length > 0 && (
          <FeaturedProductsSection
            products={featuredProducts}
            Motion={Motion}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            t={t}
            locale={locale}
          />
        )}

        {/* الفئات */}
        <CategorySection />

        {/* قسم الإحصائيات */}
        <StatsSection />

        {/* قسم الشهادات */}
        <TestimonialsSection />

        {/* قسم الأسئلة الشائعة */}
        <FAQSection />

        {/* قسم الاتصال */}
        <ContactSection />
      </main>

      {/* الفوتر */}
      <Footer />
    </div>
  );
};

export default React.memo(Home);
