import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Truck, Clock } from 'lucide-react';
import LazyImage from '../components/common/LazyImage';
// Page-scoped styles for home (moved from global main.jsx)
import '../styles/HomePage.scss';
import '../styles/top-strips.scss';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useMarketing } from '../context/MarketingContext';
import ProductCard from '../components/products/ProductCard';
import Seo from '../components/Seo';
import HeroBannerSlider from '../components/HeroBannerSlider';
import CategoryChips from '../components/CategoryChips';
import { useSettings } from '../context/SettingsContext';
import api from '../api/client';
import BrandsStrip from '../components/home/BrandsStrip';
import HomeHero from '../components/home/HomeHero';

const Home = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products, loading } = useProducts() || { products: [], loading: false };
  const { byLocation, features: marketingFeatures } = useMarketing() || { byLocation:{ topStrip:[], homepage:[], footer:[]}, features:[] };
  const [cats, setCats] = React.useState([]);
  React.useEffect(()=>{
    let mounted = true;
    api.listCategories({ withCounts: 1 }).then(r=>{
      if (mounted && r?.categories) setCats(r.categories);
    }).catch(()=>{});
    return ()=>{ mounted = false; };
  },[]);
  const topCats = React.useMemo(()=>{
    const uniq = new Map();
    for (const c of cats) { const k = c.slug||c.id; if (!uniq.has(k)) uniq.set(k, c); }
    return Array.from(uniq.values()).sort((a,b)=> (b.productCount||0)-(a.productCount||0)).slice(0,8);
  },[cats]);
  const baseProductsPath = locale === 'en' ? '/en/products' : (locale === 'fr' ? '/fr/products' : '/products');

  // choose first N discounted or highest stock as featured (simple heuristic)
  const featuredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const scored = products.map(p => ({
      ...p,
      __score: (p.oldPrice ? 50 : 0) + (p.stock || 0) - (p.price || 0) * 0.01
    }));
    return scored.sort((a,b)=>b.__score - a.__score).slice(0, 6);
  }, [products]);

  const latestProducts = useMemo(() => (products || []).slice(-6).reverse(), [products]);
  const discountProducts = useMemo(() => (products || []).filter(p => {
    const opRaw = (p.oldPrice ?? p.originalPrice);
    const op = opRaw != null ? +opRaw : NaN;
    const price = p.price != null ? +p.price : NaN;
    return Number.isFinite(op) && Number.isFinite(price) && op > price;
  }).slice(0,6), [products]);

  // Hero visual: pick a product image from featured → latest → fallback
  const heroVisual = useMemo(() => {
    const pick = (arr) => Array.isArray(arr) && arr.find(p => p?.image || (Array.isArray(p?.images) && p.images[0]));
    const chosen = pick(featuredProducts) || pick(latestProducts) || pick(products) || null;
  const src = chosen?.image || (Array.isArray(chosen?.images) ? chosen.images[0] : null) || '/images/hero-image.svg';
    const alt = (chosen?.name && (chosen.name[locale] || chosen.name.ar || chosen.name.en)) || 'Featured product';
    return { src, alt };
  }, [featuredProducts, latestProducts, products, locale]);

  // Preload hero & first few product images for perceived performance
  // Preload unique image URLs only to avoid duplicate keys and wasted preloads
  const preloadImages = useMemo(() => {
    const imgs = [...featuredProducts.slice(0,2), ...latestProducts.slice(0,2)]
      .map(p => p.image)
      .filter(Boolean);
    return Array.from(new Set(imgs));
  }, [featuredProducts, latestProducts]);

  // If marketing features exist, map them; otherwise fallback to static translation-based
  const features = useMemo(() => {
    if (marketingFeatures && marketingFeatures.length) {
      return marketingFeatures.slice(0,6).map(f => ({
        id: f.id,
        icon: f.icon ? <span className="text-2xl" aria-hidden="true">{f.icon}</span> : <Shield className="w-8 h-8" />,
        title: f.title?.[locale] || f.title?.ar || f.title?.en,
        description: f.body?.[locale] || f.body?.ar || f.body?.en || ''
      }));
    }
    return [
      { icon: <Truck className="w-8 h-8" />, title: t('featureFreeShippingTitle'), description: t('featureFreeShippingDesc') },
      { icon: <Shield className="w-8 h-8" />, title: t('featureQualityTitle'), description: t('featureQualityDesc') },
      { icon: <Clock className="w-8 h-8" />, title: t('featureFastDeliveryTitle'), description: t('featureFastDeliveryDesc') }
    ];
  }, [marketingFeatures, t, locale]);

  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `${t('home')} | ${siteName}` : `${siteName} | ${t('home')}`;
  const pageDesc = t('heroLead');

  return (
  <div className="home-page-wrapper bg-white text-black dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <Seo title={pageTitle} description={pageDesc} />
      {/* Top Strip (Marketing banners location=topStrip) */}
      {byLocation.topStrip && byLocation.topStrip.length > 0 && (
        <div className="top-strip bg-primary-red text-white text-sm">
          <div className="container-custom flex flex-col md:flex-row gap-3 py-2 items-center justify-center">
            {byLocation.topStrip.slice(0,3).map(b => (
              <a key={b.id} href={b.linkUrl || '#'} className="inline-flex items-center gap-2 hover:opacity-90 transition" style={{maxWidth:'100%'}}>
                {b.image && <img src={b.image} alt={b.title?.[locale] || b.title?.ar || b.title?.en || ''} className="h-7 w-auto rounded-md object-cover" />}
                <span className="truncate font-medium">{b.title?.[locale] || b.title?.ar || b.title?.en}</span>
              </a>
            ))}
          </div>
        </div>
      )}

  {/* Homepage Marketing Slider */}
  <HeroBannerSlider />

  {/* Hero Section */}
  <header className="home-hero bg-gradient-to-l from-primary-red to-primary-gold text-white dark:bg-gray-800 dark:text-gray-200 rounded-b-2xl sm:rounded-b-3xl shadow-[0_10px_30px_rgba(0,0,0,.08)] relative overflow-hidden pt-2 sm:pt-4 pb-2 sm:pb-6" aria-labelledby="hero-heading">
        {/* subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[.06]" style={{backgroundImage:'radial-gradient(ellipse at 20% 0%,#fff,transparent 40%), radial-gradient(ellipse at 80% 100%,#fff,transparent 40%)'}} aria-hidden="true" />
  <div className="home-hero__inner container-custom relative px-2 sm:px-6">
          <motion.div
            className="home-hero__content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-2 sm:mb-3">
              <span className="inline-flex items-right gap-1 sm:gap-2 text-xs sm:text-[.8rem] font-semibold bg-white/15 border border-white/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
                {locale==='ar' ? 'خصومات حتى 30٪' : 'Up to 30% off'}
              </span>
            </div>
            <h1 id="hero-heading" className="home-hero__title text-2xl sm:text-4xl font-extrabold flex flex-col gap-2 mb-2 text-center sm:text-right">
              <span className="inline-flex items-center gap-2 align-middle justify-center sm:justify-start">
                <img
                  src={setting?.logoUrl || setting?.logo || '/images/site-logo.png'}
                  alt=""
                  aria-hidden="true"
                  className="home-hero__brand inline-block h-8 sm:h-12 w-auto object-contain drop-shadow"
                  style={{verticalAlign:'middle', objectFit:'contain', maxWidth:'80px'}}
                />
                <span className="truncate max-w-[70vw]">{siteName || t('heroTitle')}</span>
              </span>
              <span className="home-hero__subtitle text-base sm:text-xl opacity-90 mt-1">{t('heroSubtitle')}</span>
            </h1>
            <p className="home-hero__lead text-sm sm:text-lg mt-2 mb-4 max-w-[90vw] text-center sm:text-right">{t('heroLead')}</p>
            <div className="home-hero__actions sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-center sm:items-start" role="group" aria-label="الروابط الرئيسية">
       {/* زر تسوق الآن */}
          <button
            className="mini-button bg-white/20 border border-white/30 text-white rounded-md hover:bg-white/30 transition-colors"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              lineHeight: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}
             onClick={() => { window.location.href = `${baseProductsPath}`; }}
          >
            تسوق<br />الآن
           
          </button>
       {/* زر تصفح العروض */}
          <button
             className="mini-button bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md transition-colors" onClick={() => window.location.href = '/offers'} 
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'left',
              justifyContent: 'center',
              fontSize: '9px',
              lineHeight: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}
        
          >
            تصفح<br />العروض
            
          </button>
       {/* زر شاهد المنتجات */}
          <button
            className="mini-button bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md transition-colors"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              lineHeight: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}
            onClick={() => { window.location.href = '/products'; }}
          >
            شاهد<br />المنتجات
          </button>
            </div>
          </motion.div>
          {/* Side visual with subtle float animation */}
          <motion.div
            className="home-hero__visual"
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            animate={{ opacity: 1, y: [0, -8, 0], rotate: [-2, 0, -2] }}
            transition={{ duration: 1.2, delay: .15, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
            style={{ position: 'absolute', insetInlineEnd: '3%', bottom: '6%', width: 'clamp(160px, 34vw, 420px)', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <img
              src={heroVisual.src}
              alt=""
              className="shadow-2xl rounded-2xl"
              style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              loading="eager"
            />
          </motion.div>
        </div>
      </header>

      {/* Category Chips */}
  <div className="backdrop-blur-sm bg-white/75 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b dark:border-gray-800">
        <div className="container-custom py-3">
          <CategoryChips />
        </div>
      </div>

      {/* Features */}
  <section className="home-features section-padding bg-white dark:bg-gray-900" aria-label="store features">
        <div className="container-custom">
          <ul className="home-features__grid">
            {features.map((feature, index) => (
              <motion.li
                key={feature.id ?? `${feature.title || 'feature'}-${index}`}
                className="home-feature bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <span className="home-feature__icon">{feature.icon}</span>
                <h3 className="home-feature__title">{feature.title}</h3>
                <p className="home-feature__text">{feature.description}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>


      {/* Category Showcase */}
      {topCats.length > 0 && (
        <section className="section-padding bg-white dark:bg-gray-800 dark:text-gray-300" aria-labelledby="cats-head">
          <div className="container-custom">
            <div className="home-section-head text-center">
              <h2 id="cats-head" className="home-section-head__title">{locale==='ar'?"تصفح حسب التصنيف":"Browse by Category"}</h2>
              <p className="home-section-head__subtitle">{locale==='ar'?"اختيارات سريعة لأفضل الأقسام":"Quick picks for top categories"}</p>
            </div>
            {/* Responsive grid for categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" aria-live="polite">
              {topCats.map((c,i)=> {
                const name = locale==='ar' ? (c.name?.ar||c.slug) : (c.name?.en||c.slug);
                const countLabel = typeof c.productCount==='number'
                  ? (locale==='ar' ? `${c.productCount} منتج` : `${c.productCount} items`)
                  : null;
                const initials = (c.name?.ar||c.slug||'').slice(0,2);
                return (
                  <motion.div key={c.id||c.slug} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:.45, delay:i*.04}}>
                    <Link
                      to={`${baseProductsPath}?category=${encodeURIComponent(c.slug)}&page=1`}
                      className="cat-card"
                      aria-label={name}
                    >
                      <div className="cat-card__media">
                        {c.image ? (
                          <img src={c.image} alt={name} />
                        ) : (
                          <div className="cat-card__placeholder" aria-hidden="true">{initials}</div>
                        )}
                        <div className="cat-card__overlay">
                          <div className="cat-card__title" title={name}>{name}</div>
                          {countLabel && <div className="cat-card__badge" aria-label={countLabel}>{countLabel}</div>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Brands Strip after categories */}
      <BrandsStrip />
      
      {/* Featured Products */}

  <section className="home-products section-padding bg-gray-50 dark:bg-gray-800 dark:text-gray-200" aria-labelledby="featured-heading">
    <div className="container-custom">
      <div className="home-section-head text-center">
        <h2 id="featured-heading" className="home-section-head__title">{t('featuredProducts')}</h2>
        <p className="home-section-head__subtitle">{t('featuredSubtitle')}</p>
      </div>
      {/* Responsive grid for products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" aria-live="polite">
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`feat-skel-${i}`} className="animate-pulse bg-gray-100 h-60 rounded-xl" />
          ))
        )}
        {!loading && featuredProducts.length === 0 && (
          <div className="py-8 text-center text-sm opacity-70">—</div>
        )}
        {!loading && featuredProducts.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link to={baseProductsPath} className="btn-primary text-lg px-8 py-4">
          {t('viewAllProducts')}
        </Link>
      </div>
    </div>
  </section>

      {/* Latest Products */}

  <section className="home-products section-padding bg-white dark:bg-gray-900 dark:text-gray-200" aria-labelledby="latest-heading">
    <div className="container-custom">
      <div className="home-section-head text-center">
        <h2 id="latest-heading" className="home-section-head__title">{t('latestProducts')}</h2>
      </div>
      {/* Responsive grid for products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" aria-live="polite">
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`latest-skel-${i}`} className="animate-pulse bg-gray-100 h-60 rounded-xl" />
          ))
        )}
        {!loading && latestProducts.map((p,i)=> (
          <motion.div key={p.id} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:0.45, delay:i*0.05}}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>
    </div>
  </section>

      {/* Homepage Marketing Slider */}
      <HeroBannerSlider />

      {/* Improved HomeHero component */}
      <HomeHero
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        lead={t('heroLead')}
        shopLink={baseProductsPath}
        infoLink={'/offers'}
        brandImg={setting?.logoUrl || setting?.logo || '/images/site-logo.png'}
      />
  </div>
);
}

export default Home;