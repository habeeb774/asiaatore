import React, { useState, useEffect, useMemo } from 'react';
import { motion } from '../lib/framerLazy';
import { useProducts } from '../stores/ProductsContext';
import { useHomeProducts, useMotionVariants } from '../hooks/useHomeProducts';
import { useLanguage } from '../stores/LanguageContext';
import { useTranslation } from 'react-i18next';
import HeroUnified from '../components/HeroUnified';
import FeaturedProductsSection from '../components/home/FeaturedProductsSection';
import CategoriesSection from '../components/home/CategoriesSection';
import OffersSpecialSection from '../components/home/OffersSpecialSection';
import BrandsStrip from '../components/home/BrandsStrip';

const Home = () => {
  const { products, loading } = useProducts();
  const { featuredProducts } = useHomeProducts(products);
  const { containerVariants, itemVariants } = useMotionVariants();
  const { locale } = useLanguage();
  const { t } = useTranslation();

  return (
    <>
      {/* قسم الهيرو الرئيسي مع الإعلانات والشعار */}
      <HeroUnified />

      {/* قسم الفئات */}
      <CategoriesSection
        title="تصفح حسب الفئة"
      />



      {/* قسم المنتجات المميزة */}
      <FeaturedProductsSection
        products={featuredProducts}
        Motion={motion}
        containerVariants={containerVariants}
        itemVariants={itemVariants}
        t={t}
        locale={locale}
      />
     <OffersSpecialSection
        products={products}
        Motion={motion}
        t={t}
        locale={locale}
      />
      <BrandsStrip/>
    </>
  );
}

export default Home;