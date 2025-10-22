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

<div className="home-page-wrapper text-black dark:bg-red-900 dark:text-gray-100 min-h-screen">

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

  {/* Hero Section with HeroBannerSlider at the top */}
  
<header
      className="home-hero text-white dark:bg-gray-900 dark:text-gray-200 rounded-b-[2rem] shadow-2xl relative overflow-hidden pt-8 pb-12"
      aria-labelledby="hero-heading"
      style={{
        background: 'linear-gradient(120deg, #b91c1c 0%, #ef4444 60%, #fbbf24 100%)',
        Height: '400px'
      }}
    >
       {/* Subtle overlay for depth */}
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.2) 0%, transparent 30%)`}} aria-hidden="true" />
      <div
        className={`container mx-auto relative px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12`}
        style={locale === 'ar' ? {direction:'ltr'} : {direction:'rtl'}}
  >

      <div
        className="pointer-events-none absolute inset-0 opacity-[.06]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%,#fff,transparent 40%), radial-gradient(ellipse at 80% 100%,#fff,transparent 40%)',
        }}
        aria-hidden="true"
      />

        <div
          style={{
            display: 'flex',
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: '32px',
            width: '100%',
            minHeight: '340px',
            justifyContent: 'space-between',
            maxWidth: '101000px',
            margin: locale === 'ar' ? '0 0 0 auto' : '0 auto 0 0',
            justifyContent: 'space-evenly',
            justifyItems: 'center',
          }}
        >
          {/* عمود النصوص والشعار */}
          <motion.div
            className="home-hero__content"
            initial={{ opacity: 0, x: locale === 'ar' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{textAlign: locale === 'ar' ? 'right' : 'left', flex: '1 1 1%', minWidth: '0'}}
          >
            {/* شعار الجوال أعلى شارة الخصم */}
            <div className="flex justify-center items-center mb-2 sm:hidden">
              <img
                src={setting?.logoUrl || setting?.logo || '/images/site-logo.svg'}
                alt="logo"
                className="block h-10 w-auto object-contain drop-shadow-lg"
                style={{margin: 0}}
              />
            </div>
            {/* شارة الخصم */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',minWidth:'120px'}}>
              <span className="inline-flex items-start gap-2 text-sm font-semibold bg-white/15 border border-white/20 rounded-full px-3 py-1 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
                {locale === 'ar' ? 'خصومات حتى 30٪' : 'Up to 30% off'}
              </span>
            </div>
            <div>
              {/* صف الشعار واسم المتجر والعنوان */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '180px',
                  maxWidth: '100%',
                  justifyContent: 'space-evenly',
                }}
              >
               
                {/* شعار واسم المتجر */}
                <div style={{display:'flex',flexDirection: locale === 'ar' ? 'row-reverse' : 'row',alignItems:'center',gap:'10px',minWidth:'180px',maxWidth:'100%',justifyContent:'flex-center'}}>
                  <span className="truncate max-w-[70vw] text-base sm:text-5xl font-extrabold text-center mx-auto sm:text-right sm:mx-0">{siteName || t('heroTitle')}</span>
                  <img
                    src={setting?.logoUrl || setting?.logo || '/images/site-logo.svg'}
                    alt="logo"
                    className="hidden sm:inline h-10 sm:h-14 w-auto object-contain drop-shadow-lg"
                    style={{marginLeft: locale === 'ar' ? 0 : '8px', marginRight: locale === 'ar' ? '8px' : 0}}
                  />
                </div>
                {/* العنوان */}
                
              </div>
              {/* شارة الخصم والوصف */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: '18px',
                  width: '100%',
                  marginBottom: '1px',
                  justifyContent: 'flex-center',
                   justifyContent: 'space-evenly',
                }}
              >
                
                {/* الوصف */}
                <div style={{display:'flex',alignItems:'center',minWidth:'220px',maxWidth:'320px',justifyContent:'center'}}>
                  <p className="text-base sm:text-lg opacity-95 max-w-xl" style={{textAlign:'center',margin:0,width:'100%'}}>
                    
                  </p>
                </div>
              </div>
              {/* الأزرار في صف منفصل */}
              <div className="flex gap-3 flex-wrap justify-center items-center sm:justify-end mt-6" style={{width:'100%'}}>
                <button
                    className="mini-button bg-white text-[#7c1d1d] rounded-full w-10 h-10 text-[9px] font-semibold shadow-md border border-white/30 text-center overflow-hidden flex items-center justify-center p-0 transition-all duration-300 hover:scale-105 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200 animate-pulse"
                  onClick={() => (window.location.href = `${baseProductsPath}`)}
                >
                  <span className="block w-full animate-pulse" style={{animationDuration:'1000ms'}}>{locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}</span>
                </button>
                <button
                    className="mini-button bg-white text-[#7c1d1d] rounded-full hover:bg-gray-100 transition-all px-2 py-1 w-8 h-5 text-[10px] font-semibold shadow-md border border-white/30 text-center overflow-hidden flex items-center justify-center"
                  onClick={() => (window.location.href = '/offers')}
                >
                  {locale === 'ar' ? 'تصفح العروض' : 'View Offers'}
                </button>
              
              </div>
            </div>
          </motion.div>
          {/* عمود السلايدر */}
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }} style={{flex: '1 1 0%', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div className="shadow-2xl rounded-3xl overflow-hidden w-full max-w-[900px] border-4 border-white/20 backdrop-blur-sm">
              <HeroBannerSlider />
            </div>
          </motion.div>
        </div>
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



      {/* Improved HomeHero component removed to avoid duplicate hero/slider */}
  </div>
);
}

export default Home;