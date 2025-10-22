import React, { useState, useMemo } from 'react';

// --- Mock Implementations & Data (for a runnable single-file demo) ---

// 1. Mock External Libraries
const motion = { // Mock for framer-motion
  div: ({ children, initial, animate, transition, whileInView, viewport, ...props }) => <div {...props}>{children}</div>,
  li: ({ children, initial, animate, transition, whileInView, viewport, ...props }) => <li {...props}>{children}</li>,
};
const Link = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>; // Mock for react-router-dom
const Truck = (props) => <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const Shield = (props) => <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const Clock = (props) => <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;


// 2. Mock Data
const translations = {
  en: {
    home: 'Home',
    heroTitle: 'Your Awesome Store',
    heroSubtitle: 'Discover Quality, Style, and Innovation',
    heroLead: 'Explore our curated collection of high-quality products. Shop now and enjoy exclusive deals and fast shipping worldwide.',
    featureFreeShippingTitle: 'Free Shipping',
    featureFreeShippingDesc: 'On all orders over $50',
    featureQualityTitle: 'Quality Guarantee',
    featureQualityDesc: 'Products inspected for quality',
    featureFastDeliveryTitle: 'Fast Delivery',
    featureFastDeliveryDesc: 'Get your order in 2-3 days',
    featuredProducts: 'Featured Products',
    featuredSubtitle: 'Handpicked deals just for you',
    latestProducts: 'Latest Arrivals',
    viewAllProducts: 'View All Products',
  },
  ar: {
    home: 'الرئيسية',
    heroTitle: 'متجرك الرائع',
    heroSubtitle: 'اكتشف الجودة والأناقة والابتكار',
    heroLead: 'استكشف مجموعتنا المختارة من المنتجات عالية الجودة. تسوق الآن واستمتع بصفقات حصرية وشحن سريع لجميع أنحاء العالم.',
    featureFreeShippingTitle: 'شحن مجاني',
    featureFreeShippingDesc: 'على جميع الطلبات فوق 50 دولار',
    featureQualityTitle: 'ضمان الجودة',
    featureQualityDesc: 'منتجات مفحوصة لضمان الجودة',
    featureFastDeliveryTitle: 'توصيل سريع',
    featureFastDeliveryDesc: 'استلم طلبك خلال 2-3 أيام',
    featuredProducts: 'المنتجات المميزة',
    featuredSubtitle: 'عروض مختارة خصيصًا لك',
    latestProducts: 'أحدث المنتجات',
    viewAllProducts: 'عرض كل المنتجات',
  },
};
const mockProducts = [
    { id: 1, name: { en: 'Quantum Laptop', ar: 'لابتوب كوانتوم' }, price: 999, oldPrice: 1299, stock: 50, image: 'https://placehold.co/400x400/ef4444/white?text=Laptop' },
    { id: 2, name: { en: 'Stellar Smartwatch', ar: 'ساعة ذكية ستيلر' }, price: 199, stock: 150, image: 'https://placehold.co/400x400/3b82f6/white?text=Watch' },
    { id: 3, name: { en: 'Acoustic Pods', ar: 'سماعات أذن' }, price: 89, stock: 200, image: 'https://placehold.co/400x400/22c55e/white?text=Pods' },
    { id: 4, name: { en: 'Cyber Gaming Mouse', ar: 'فأرة ألعاب سايبر' }, price: 49, oldPrice: 69, stock: 80, image: 'https://placehold.co/400x400/8b5cf6/white?text=Mouse' },
    { id: 5, name: { en: 'HD Webcam', ar: 'كاميرا ويب' }, price: 59, stock: 120, image: 'https://placehold.co/400x400/f97316/white?text=Webcam' },
    { id: 6, name: { en: 'Mechanical Keyboard', ar: 'لوحة مفاتيح ميكانيكية' }, price: 129, stock: 90, image: 'https://placehold.co/400x400/14b8a6/white?text=Keyboard' },
];
const mockCategories = [
    { id: 1, slug: 'laptops', name: { ar: 'لابتوبات', en: 'Laptops' }, productCount: 45, image: 'https://placehold.co/200x200/ef4444/white?text=Laptops' },
    { id: 2, slug: 'mobiles', name: { ar: 'جوالات', en: 'Mobiles' }, productCount: 88, image: 'https://placehold.co/200x200/3b82f6/white?text=Mobiles' },
    { id: 3, slug: 'audio', name: { ar: 'صوتيات', en: 'Audio' }, productCount: 102, image: 'https://placehold.co/200x200/22c55e/white?text=Audio' },
    { id: 4, slug: 'accessories', name: { ar: 'إكسسوارات', en: 'Accessories' }, productCount: 150, image: 'https://placehold.co/200x200/8b5cf6/white?text=Accessories' },
    { id: 5, slug: 'gaming', name: { ar: 'ألعاب', en: 'Gaming' }, productCount: 76, image: 'https://placehold.co/200x200/f97316/white?text=Gaming' },
    { id: 6, slug: 'cameras', name: { ar: 'كاميرات', en: 'Cameras' }, productCount: 32, image: 'https://placehold.co/200x200/14b8a6/white?text=Cameras' },
];


// 3. Mock Contexts & Hooks
const LanguageContext = React.createContext();
const useLanguage = () => React.useContext(LanguageContext);
import { useSettings } from '../../context/SettingsContext';
const useProducts = () => ({ products: mockProducts, loading: false });
const useMarketing = () => ({ byLocation: { topStrip: [], homepage: [], footer: [] }, features: [] });
const api = { listCategories: () => Promise.resolve({ categories: mockCategories }) };


// 4. Mock Components
const Seo = ({ title }) => { React.useEffect(() => { document.title = title; }, [title]); return null; };
const CategoryChips = () => <div className="p-2 text-center text-sm text-gray-500">[Category Chips Placeholder]</div>;
const BrandsStrip = () => <div className="py-8 text-center bg-gray-200 dark:bg-gray-700 text-sm text-gray-500">[Brands Strip Placeholder]</div>;
const HeroBannerSlider = () => (
    <div className="relative w-full aspect-[4/3] bg-gray-700">
      <img src="https://placehold.co/900x675/ef4444/white?text=Hero+Banner" alt="Hero banner placeholder" className="w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <h2 className="text-white text-3xl font-bold">Featured Product</h2>
      </div>
    </div>
);
const ProductCard = ({ product }) => {
    const { locale } = useLanguage();
    const name = product.name[locale] || product.name.en;
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm h-full flex flex-col">
            <img src={product.image} alt={name} className="w-full h-40 object-cover" />
            <div className="p-3 flex-grow flex flex-col">
                <h3 className="text-sm font-semibold truncate flex-grow" title={name}>{name}</h3>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-md font-bold text-red-600">${product.price}</p>
                    {product.oldPrice && <p className="text-xs text-gray-500 line-through">${product.oldPrice}</p>}
                </div>
            </div>
        </div>
    );
};

// --- Refactored Components ---

// The original HeroSection component, now refactored as HomeHero
const HomeHero = () => {
  const { locale, t } = useLanguage();
  const { setting } = useSettings();
  const siteName = locale === 'ar' ? (setting?.siteNameAr) : (setting?.siteNameEn);
  const baseProductsPath = '/products';

  return (
    <header
      className="home-hero text-white dark:text-gray-200 rounded-b-[2rem] relative overflow-hidden pt-8 pb-12"
      aria-labelledby="hero-heading"
      style={{
        background: 'var(--color-primary, #ef4444) !important',
        backgroundImage: 'none !important',
        border: '4px solid var(--color-primary, #ef4444)',
        boxShadow: '0 0 32px 0 var(--color-primary, #ef4444)'
      }}
    >
  {/* تم حذف طبقة overlay حتى تظهر الخلفية مباشرة من var(--color-primary) */}
      <div className="container mx-auto relative px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
       
        <motion.div className="home-hero__content order-2 lg:order-1 text-center lg:text-right" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <div className="mb-4 flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 shadow-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {locale === 'ar' ? 'خصومات حتى 30٪' : 'Up to 30% off'}
            </span>
          </div>
          <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-black flex flex-col gap-4 mb-4">
            <span className="inline-flex items-center gap-4 justify-center lg:justify-start flex-col sm:flex-row">
              <img src={setting?.logoUrl || setting?.logo || '/logo.svg'} alt="logo" className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg rounded-xl bg-white/10 p-2" />
              <span className="truncate max-w-[70vw] bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">{siteName || t('heroTitle')}</span>
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-semibold opacity-95 mt-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{t('heroSubtitle')}</span>
          </h1>
          <p className="text-lg sm:text-xl opacity-95 mb-7 max-w-2xl mx-auto lg:mx-0 leading-relaxed">{t('heroLead')}</p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-6">
            <button className="px-7 py-4 bg-white/25 backdrop-blur-sm border border-white/40 text-white rounded-xl hover:bg-white/35 hover:scale-105 transition-all duration-300 font-bold shadow-lg flex items-center justify-center gap-2" onClick={() => (window.location.href = `${baseProductsPath}`)}>
              {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }} className="w-full h-full flex justify-center order-1 lg:order-2">
          <div className="shadow-2xl rounded-3xl overflow-hidden w-full max-w-[900px] border-4 border-white/20 backdrop-blur-sm">
            <HeroBannerSlider />
          </div>
        </motion.div>
      </div>
    </header>
  );
};

// The new Home component from your prompt
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
      
      {topCats.length > 0 && (
        <section className="section-padding bg-white dark:bg-gray-900" aria-labelledby="cats-head">
          <div className="container-custom mx-auto">
            <div className="home-section-head text-center">
              <h2 id="cats-head" className="home-section-head__title">{locale === 'ar' ? "تصفح حسب التصنيف" : "Browse by Category"}</h2>
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" aria-live="polite">
                {topCats.map((c, i) => {
                    const name = locale==='ar' ? (c.name?.ar||c.slug) : (c.name?.en||c.slug);
                    return (
                        <motion.div key={c.id||c.slug} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:.45, delay:i*.04}}>
                            <Link to={`${baseProductsPath}?category=${encodeURIComponent(c.slug)}`} className="block group">
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                                   <img src={c.image} alt={name} className="w-full h-full object-cover"/>
                                </div>
                                <h3 className="mt-3 text-center font-semibold text-gray-700 dark:text-gray-300">{name}</h3>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
          </div>
        </section>
      )}

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
            <Link to={baseProductsPath} className="inline-block text-white font-bold px-8 py-3 rounded-lg transition-colors" style={{background:'var(--color-primary)', border:'none'}}>
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

export default HomeHero;

// --- Main App Component ---

const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState('ar');
    const t = (key) => translations[locale]?.[key] || key;
    const value = { locale, setLocale, t };
    
    // Set document direction based on locale
    React.useEffect(() => {
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }, [locale]);
    
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};


const LanguageToggle = () => {
    const { locale, setLocale } = useLanguage();
    return (
        <button
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="bg-white/30 backdrop-blur-md text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-white/40 transition-colors"
        >
          {locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        </button>
    );
}

// Basic styles to replicate SCSS structure
const GlobalStyles = () => (
  <style>{`
    .section-padding {
      padding-top: 4rem;
      padding-bottom: 4rem;
    }
    .home-section-head {
        margin-bottom: 2.5rem;
    }
    .home-section-head__title {
        font-size: 2.25rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: #1f2937;
    }
    .dark .home-section-head__title {
        color: #f9fafb;
    }
    .home-features__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      list-style: none;
      padding: 0;
    }
  `}</style>
);

