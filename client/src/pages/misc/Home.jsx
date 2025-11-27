import React, { lazy, Suspense } from 'react';
import { motion } from '../../lib/framerLazy';
import { useProducts } from '../../contexts/ProductsContext';
import { useHomeProducts, useMotionVariants } from '../../hooks/useHomeProducts';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { HomeSEO } from '../../utils/seo';
import ErrorBoundary from '../../components/ErrorBoundary';
import { HeroSkeleton, SliderSkeleton, ProductGridSkeleton } from '../../components/shared/SkeletonLoader/SkeletonLoader';

const HeroUnified = lazy(() => import('../../components/HeroUnified'));
const FeaturedProductsSection = lazy(() => import('../../components/home/FeaturedProductsSection'));
const CategoriesSection = lazy(() => import('../../components/home/CategoriesSection'));
const OffersSpecialSection = lazy(() => import('../../components/home/OffersSpecialSection'));
const BrandsStrip = lazy(() => import('../../components/home/BrandsStrip'));
const OffersSlider = lazy(() => import('../../components/OffersSlider/OffersSlider.jsx'));

const Home = () => {
  const { products } = useProducts();
  const { featuredProducts } = useHomeProducts(products);
  const { containerVariants, itemVariants } = useMotionVariants();
  const { locale } = useLanguage();
  const { t } = useTranslation();

  return (
    <>
      <HomeSEO locale={locale} />
      <div className="mx-auto max-w-7xl px-6 py-4 sm:px-6 sm:py-16 lg:px-8 space-y-12 sm:space-y-24">
        {/* قسم الهيرو الرئيسي مع الإعلانات والشعار */}
        <ErrorBoundary>
          <Suspense fallback={<HeroSkeleton className="my-4"/>}>
            <HeroUnified />
          </Suspense>
        </ErrorBoundary>

        {/* قسم الفئات */}
        <ErrorBoundary>
          <Suspense fallback={<SliderSkeleton className="my-4"/>}>
            <CategoriesSection
              title={t ? (t('home.browseByCategory') || 'تصفح حسب الفئة') : 'تصفح حسب الفئة'}
            />
          </Suspense>
        </ErrorBoundary>

        {/* قسم المنتجات المميزة */}
        <ErrorBoundary>
          <Suspense fallback={<ProductGridSkeleton count={6} className="my-6"/>}>
            <FeaturedProductsSection
              products={Array.isArray(featuredProducts) ? featuredProducts : []}
              Motion={motion}
              containerVariants={containerVariants}
              itemVariants={itemVariants}
              t={t}
              locale={locale}
            />
          </Suspense>
        </ErrorBoundary>

        {/* قسم عروض الخصومات (سلايدر) تحت المنتجات المميزة */}
        <ErrorBoundary>
          <Suspense fallback={<SliderSkeleton className="my-6"/>}>
            <OffersSlider className="mt-2" />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SliderSkeleton className="my-6"/>}>
            <OffersSpecialSection
              products={Array.isArray(products) ? products : []}
              Motion={motion}
              t={t}
              locale={locale}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="py-4"/>}>
            <BrandsStrip/>
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default Home;
