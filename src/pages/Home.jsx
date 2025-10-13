import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Truck, Clock } from 'lucide-react';
import LazyImage from '../components/common/LazyImage';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useMarketing } from '../context/MarketingContext';
import ProductCard from '../components/products/ProductCard';
import Seo from '../components/Seo';
import HeroBannerSlider from '../components/HeroBannerSlider';
import CategoryChips from '../components/CategoryChips';
import { useSettings } from '../context/SettingsContext';
import api from '../api/client';

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
    <div className="home-page-wrapper">
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
      <header className="home-hero bg-gradient-to-l from-primary-red to-primary-gold text-white rounded-b-3xl shadow-[0_10px_30px_rgba(0,0,0,.08)] relative overflow-hidden" aria-labelledby="hero-heading">
        {/* subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[.06]" style={{backgroundImage:'radial-gradient(ellipse at 20% 0%,#fff,transparent 40%), radial-gradient(ellipse at 80% 100%,#fff,transparent 40%)'}} aria-hidden="true" />
        <div className="home-hero__inner container-custom relative">
          <motion.div
            className="home-hero__content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 text-[.8rem] font-semibold bg-white/15 border border-white/20 rounded-full px-3 py-1 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
                {locale==='ar' ? 'خصومات حتى 30٪' : 'Up to 30% off'}
              </span>
            </div>
            <h1 id="hero-heading" className="home-hero__title">
              <span className="inline-flex items-center gap-1 align-middle">
                <img
                  src={setting?.logo || '/logo.svg'}
                  alt=""
                  aria-hidden="true"
                  className="home-hero__brand inline-block h-3 md:h-5 w-auto object-contain"
                  style={{verticalAlign:'middle', objectFit:'contain'}}
                />
                <span>{siteName || t('heroTitle')}</span>
              </span>
              <span className="home-hero__subtitle">{t('heroSubtitle')}</span>
            </h1>
            <p className="home-hero__lead">{t('heroLead')}</p>
            <div className="home-hero__actions" role="group" aria-label="الروابط الرئيسية">
              <Link to={baseProductsPath} className="btn-primary home-hero__btn" aria-label={t('heroCtaShop')}>
                {t('heroCtaShop')} <ArrowLeft size={20} aria-hidden="true" />
              </Link>
              <Link to="/about" className="btn-secondary home-hero__btn" aria-label={t('heroCtaAbout')}>
                {t('heroCtaAbout')}
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="home-hero__visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <LazyImage
              src="/images/hero-image.jpg"
              alt="منتجات آسيوية"
              className="home-hero__image"
              priority
            />
            <div className="home-hero__shape" aria-hidden="true" />
          </motion.div>
        </div>
      </header>

      {/* Category Chips */}
      <div className="backdrop-blur-sm bg-white/75 supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="container-custom py-3">
          <CategoryChips />
        </div>
      </div>

      {/* Features */}
      <section className="home-features section-padding bg-white" aria-label="store features">
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
        <section className="section-padding bg-white" aria-labelledby="cats-head">
          <div className="container-custom">
            <div className="home-section-head text-center">
              <h2 id="cats-head" className="home-section-head__title">{locale==='ar'?'تصفح حسب التصنيف':'Browse by Category'}</h2>
              <p className="home-section-head__subtitle">{locale==='ar'?'اختيارات سريعة لأفضل الأقسام':'Quick picks for top categories'}</p>
            </div>
            <div className="featured-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
              {topCats.map((c,i)=> (
                <motion.div key={c.id||c.slug} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:.45, delay:i*.04}}>
                  <Link to={`${baseProductsPath}?category=${encodeURIComponent(c.slug)}&page=1`} className="block rounded-2xl bg-white shadow hover:shadow-2xl transition overflow-hidden">
                    <div style={{aspectRatio:'4/3', background:'#f3f4f6', display:'grid', placeItems:'center'}}>
                      {c.image
                        ? <img src={c.image} alt={c.name?.ar||c.slug} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontSize:'2rem',fontWeight:800,color:'#69be3c'}}>{(c.name?.ar||c.slug).slice(0,2)}</span>
                      }
                    </div>
                    <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontWeight:700}}>{locale==='ar'?(c.name?.ar||c.slug):(c.name?.en||c.slug)}</span>
                      {typeof c.productCount==='number' && <span style={{fontSize:12,opacity:.7}}>{c.productCount}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="home-products section-padding bg-gray-50" aria-labelledby="featured-heading">
        <div className="container-custom">
          <div className="home-section-head text-center">
            <h2 id="featured-heading" className="home-section-head__title">{t('featuredProducts')}</h2>
            <p className="home-section-head__subtitle">{t('featuredSubtitle')}</p>
          </div>
          <div className="featured-grid" aria-live="polite">
            {loading && <div className="py-8 text-center text-sm opacity-70">...loading</div>}
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
      <section className="home-products section-padding bg-white" aria-labelledby="latest-heading">
        <div className="container-custom">
          <div className="home-section-head text-center">
            <h2 id="latest-heading" className="home-section-head__title">{t('latestProducts')}</h2>
          </div>
          <div className="featured-grid" aria-live="polite">
            {loading && <div className="py-8 text-center text-sm opacity-70">{t('loading')}</div>}
            {!loading && latestProducts.map((p,i)=> (
              <motion.div key={p.id} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:0.45, delay:i*0.05}}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Discounts */}
      <section className="home-products section-padding bg-gray-50" aria-labelledby="discounts-heading">
        <div className="container-custom">
          <div className="home-section-head text-center">
            <h2 id="discounts-heading" className="home-section-head__title">{t('discountProducts')}</h2>
          </div>
          <div className="featured-grid" aria-live="polite">
            {loading && <div className="py-8 text-center text-sm opacity-70">{t('loading')}</div>}
            {!loading && discountProducts.length === 0 && <div className="py-8 text-center text-sm opacity-70">—</div>}
            {!loading && discountProducts.map((p,i)=> (
              <motion.div key={p.id} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:0.45, delay:i*0.05}}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/offers" className="btn-secondary px-6 py-3">{t('offers')}</Link>
          </div>
        </div>
      </section>

      {/* Blog preview (static placeholder for now) */}
      <section className="home-blog section-padding bg-white" aria-labelledby="blog-heading">
        <div className="container-custom">
          <div className="home-section-head text-center">
            <h2 id="blog-heading" className="home-section-head__title">{t('عنا')}</h2>
          </div>
          <div className="blog-preview-grid">
      
          </div>
          <div className="text-center mt-10">
            <Link to="/blog" className="btn-primary px-7 py-3">{t('المزيد')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;