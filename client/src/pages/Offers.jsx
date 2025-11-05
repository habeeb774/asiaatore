import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from '../lib/framerLazy';
import ProductCard, { ProductCardSkeleton } from '../components/shared/ProductCard';
import CategoryChips from '../components/CategoryChips';
import BrandsStrip from '../components/home/BrandsStrip';
import Seo from '../components/Seo';
import HomeHero from '../components/home/HomeHero';
import CategoriesSection from '../components/home/CategoriesSection';
import ProductSlider from '../components/products/ProductSlider';
import HomeFeatures from '../components/home/HomeFeatures';
import FeaturedProductsSlider from '../components/home/FeaturedProductsSlider';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import { useMarketing } from '../context/MarketingContext';
import { resolveLocalized } from '../utils/locale';
import api from '../api/client';
// Styles consolidated into `styles/index.scss`
import Offers from './Offers';

const Home = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const { features: marketingFeatures, byLocation } = useMarketing() || { byLocation:{ topStrip:[], homepage:[], footer:[]}, features:[] };
  const [cats, setCats] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedCat, setSelectedCat] = useState(null);

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

  const baseProductsPath = locale === 'en' ? '/en/products' : '/products';

  // Avoid treating the OffersPage component as data — derive featured products from products
  const featuredProducts = useMemo(()=> (products || []).slice(0,6), [products]);
  const latestProducts = useMemo(()=> (products || []).slice(-6).reverse(), [products]);
  const DiscountedSlider = useMemo(()=> (products || []).filter(p => p.oldPrice && p.oldPrice > p.price).slice(0,6), [products]);

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
                {b.image && <img src={b.image} alt={resolveLocalized(b.title,locale)} className="h-8 w-auto rounded-md object-cover" />}
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

      <HomeFeatures features={features} />

      <div className="home-sections w-full overflow-hidden">
        {/* Categories Section */}
        <section className="relative bg-gradient-to-b from-emerald-50 to-white py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-4 lg:px-6">
            <div className="-mt-8 md:-mt-14">
              <CategoriesSection
                categories={topCats}
                title={locale === 'ar' ? 'الاقسام' : 'Categories'}
                selected={selectedCat}
                onSelect={(slug) => setSelectedCat(slug)}
              />
            </div>
          </div>
        </section>

        {/* Featured Products Slider */}
        <section className="relative py-12 md:py-16 bg-gradient-to-t from-white to-emerald-50">
          <div className="container mx-auto px-2 sm:px-4 lg:px-8">
            <ProductSlider
              products={products}
              title={locale === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
            />
          </div>
        </section>

        {/* Brands */}
        <BrandsStrip />

        {/* Discounted / Offers Slider */}
        <Offers products={DiscountedSlider} />

        {/* Latest Products */}
        <section className="home-products section-padding bg-white dark:bg-gray-900">
          <div className="container-fixed">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('latestProducts')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />) : latestProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
