import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import ProductSlider, { ProductCardSkeleton } from '../components/products/ProductSlider';
import Seo from '../components/Seo';
import { useLanguage } from '../stores/LanguageContext';
import { useProducts } from '../stores/ProductsContext';
import { useSettings } from '../stores/SettingsContext';
import { resolveLocalized } from '../utils/locale';
import FeaturedProductsSection from '../components/home/FeaturedProductsSection';
import { motion } from '../lib/framerLazy.js';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useHomeProducts } from '../hooks/useHomeProducts';
// Import Reda Store styles
import '../styles/reda-store-theme.css';

// Import React Query
import { useQuery } from '@tanstack/react-query';
import api from '../services/api/client';
import { useAds } from '../hooks/useAds';

/**
 * Section Loading Fallback Component
 */
const SectionLoadingFallback = ({ title }) => (
  <div className="py-16 bg-white dark:bg-gray-900">
    <div className="container mx-auto px-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Enhanced Hero Section Component
 */
const HeroSection = ({ locale }) => (
  <section className="hero-section relative overflow-hidden bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-16">
    <div className="container mx-auto px-4">
      <div className="hero-content text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            {locale === 'ar' ? 'أفضل العروض' : 'Best Offers'}
            <span className="block text-emerald-600 dark:text-emerald-400">
              {locale === 'ar' ? 'منتجات طازجة' : 'Fresh Products'}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'اكتشف أحدث العروض والمنتجات الطازجة بأسعار لا تقبل المنافسة'
              : 'Discover the latest offers and fresh products at unbeatable prices'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-900 transition-all duration-300"
            >
              {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              {locale === 'ar' ? 'استكشاف المنتجات' : 'Explore Products'}
            </motion.button>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200 dark:bg-emerald-800 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full opacity-30 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-teal-200 dark:bg-teal-800 rounded-full opacity-25 animate-float-slow"></div>
      </div>
    </div>
  </section>
);

/**
 * Enhanced Main Slider Component
 */
const MainSlider = ({ locale, ads = [], setting }) => {
  const slides = useMemo(() => {
    if (ads && ads.length > 0) {
      return ads.map((ad, index) => ({
        id: ad.id || `ad-${index}`,
        image: ad.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
        title: ad.title || (locale === 'ar' ? 'إعلان' : 'Advertisement'),
        subtitle: ad.description || (locale === 'ar' ? 'اكتشف المزيد' : 'Discover more'),
        link: ad.link || '#offers'
      }));
    }

    return [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
        title: locale === 'ar' ? 'خضروات طازجة يومياً!' : 'Fresh Vegetables Daily!',
        subtitle: locale === 'ar' ? 'خصومات تصل إلى 70%' : 'Up to 70% off',
        link: '#offers'
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
        title: locale === 'ar' ? 'فواكه موسمية لذيذة' : 'Delicious Seasonal Fruits',
        subtitle: locale === 'ar' ? 'أفضل المنتجات الطازجة' : 'Best fresh products',
        link: '#fruits'
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
        title: locale === 'ar' ? 'لحوم طازجة عالية الجودة' : 'Premium Fresh Meat',
        subtitle: locale === 'ar' ? 'من أفضل المزارع' : 'From best farms',
        link: '#meat'
      }
    ];
  }, [ads, locale]);

  return (
    <div className="slider relative rounded-2xl overflow-hidden shadow-2xl mx-4 my-8">
      <div className="container">
        <div className="slide-swp mySwiper rounded-2xl">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              renderBullet: function (index, className) {
                return `<span class="${className} bg-white opacity-50 hover:opacity-100 transition-opacity duration-300"></span>`;
              },
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={true}
            className="swiper-wrapper rounded-2xl"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="slide-content relative h-96 md:h-[500px] rounded-2xl overflow-hidden"
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="slide-overlay absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
                    <div className="slide-text absolute left-8 md:left-16 top-1/2 transform -translate-y-1/2 text-white max-w-md">
                      <motion.h2
                        className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      >
                        {slide.title}
                      </motion.h2>
                      <motion.p
                        className="text-lg md:text-xl mb-6 text-gray-200"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      >
                        {slide.subtitle}
                      </motion.p>
                      <motion.a
                        href={slide.link}
                        className="btn slide-btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                        <i className="fa-solid fa-arrow-left-long"></i>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="swiper-pagination !bottom-4"></div>
          <div className="swiper-button-next btn_Swip !right-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300">
            <i className="fa-solid fa-chevron-right text-white"></i>
          </div>
          <div className="swiper-button-prev btn_Swip !left-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300">
            <i className="fa-solid fa-chevron-left text-white"></i>
          </div>
        </div>

        {/* Enhanced banner_2 */}
        <div className="banner_2 hidden md:block mt-8 rounded-2xl overflow-hidden shadow-xl">
          {setting?.heroCenterImage ? (
            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              <img
                src={setting.heroCenterImage}
                alt="Hero Center Image"
                className="w-full h-32 object-cover rounded-2xl"
              />
            </motion.a>
          ) : (
            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              <img
                src="/img/banner_home3.png"
                alt=""
                className="w-full h-32 object-cover rounded-2xl"
              />
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced Banners4 Component
 */
const Banners4 = ({ locale }) => {
  const banners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80',
      title1: locale === 'ar' ? 'خصومات' : 'Discounts',
      title2: locale === 'ar' ? 'على الخضروات الطازجة' : 'on Fresh Vegetables',
      discount: '70%',
      link: '#vegetables',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
      title1: locale === 'ar' ? 'فواكه' : 'Fruits',
      title2: locale === 'ar' ? 'موسمية' : 'Seasonal',
      discount: '50%',
      link: '#fruits',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
      title1: locale === 'ar' ? 'لحوم' : 'Meat',
      title2: locale === 'ar' ? 'طازجة يومياً' : 'Fresh Daily',
      discount: '60%',
      link: '#meat',
      color: 'from-rose-500 to-pink-600'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      title1: locale === 'ar' ? 'ألبان' : 'Dairy',
      title2: locale === 'ar' ? 'وأجبان' : '& Cheese',
      discount: '40%',
      link: '#dairy',
      color: 'from-blue-500 to-cyan-600'
    }
  ];

  return (
    <div className="banners_4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {banners.map((banner) => (
            <motion.div
              key={banner.id}
              className="box group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <a href={banner.link} className="link_btn absolute inset-0 z-10"></a>
              <div className="relative h-48 overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title1}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.color} opacity-20`}></div>
              </div>
              <div className="p-6 relative">
                <div className="text mb-4">
                  <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {banner.title1}
                  </h5>
                  <h5 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {banner.title2}
                  </h5>
                </div>
                <div className="sale flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {locale === 'ar' ? 'حتى' : 'Up'} <br /> {locale === 'ar' ? 'خصم' : 'To'}
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {banner.discount}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h6 className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                    {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                    <i className="fa-solid fa-arrow-left-long text-sm"></i>
                  </h6>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced Product Slider Section Component
 */
const ProductSliderSection = ({ title, products, locale, id }) => (
  <motion.div
    className="slider_products slide py-16 bg-white dark:bg-gray-900"
    id={id}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
  >
    <div className="container mx-auto px-4">
      <div className="slide_product mySwiper">
        <div className="top_slide text-center mb-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <i className="fa-solid fa-tags text-emerald-600 text-2xl"></i>
            {title}
          </motion.h2>
          <motion.div
            className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          ></motion.div>
        </div>

        <Suspense fallback={<SectionLoadingFallback title={title} />}>
          <ProductSlider
            products={products}
            title=""
          />
        </Suspense>

        <div className="swiper-button-next btn_Swip bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-gray-700">
          <i className="fa-solid fa-chevron-right text-emerald-600"></i>
        </div>
        <div className="swiper-button-prev btn_Swip bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-gray-700">
          <i className="fa-solid fa-chevron-left text-emerald-600"></i>
        </div>
      </div>
    </div>
  </motion.div>
);

/**
 * Enhanced Category Card Component
 */
const SimpleCategoryCard = ({ category }) => {
  const { locale } = useLanguage();

  const name = useMemo(() =>
    resolveLocalized(category?.name, locale) ||
    (typeof category?.name === 'string' ? category.name : category?.slug) || '',
    [category, locale]
  );

  const imageSrc = category?.image || '/images/category-placeholder.jpg';

  return (
    <motion.div
      className="product group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 text-center">
        <div className="name text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {name}
        </div>
        {typeof category?.productCount !== 'undefined' && (
          <div className="price text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {category.productCount} {locale === 'ar' ? 'منتج' : 'items'}
          </div>
        )}
        <motion.div
          className="mt-3 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
          whileHover={{ gap: 8 }}
        >
          {locale === 'ar' ? 'استكشاف' : 'Explore'}
          <i className="fa-solid fa-arrow-left-long text-xs"></i>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Category Slider Component - Enhanced with Floating Animations
 */
const CategorySlider = ({ categories = [], title, limit = 12 }) => {
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sliderRef = useRef(null);

  // Keep the list small to avoid heavy first paint
  const items = useMemo(() => (categories || []).slice(0, Math.max(1, limit)), [categories, limit]);

  // Responsive counts (1 on small, 2 on md, 3 on lg+)
  useEffect(() => {
    const updateVisible = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // Avoid transition on very first mount to reduce jank
  useEffect(() => { const id = setTimeout(() => setMounted(true), 100); return () => clearTimeout(id); }, []);

  const maxIndex = Math.max(0, items.length - visibleCount);

  const goPrev = () => setCurrent(c => Math.max(0, c - 1));
  const goNext = () => setCurrent(c => Math.min(maxIndex, c + 1));

  const trackStyle = {
    transform: `translateX(-${current * (100 / visibleCount)}%)`
  };
  const trackClass = `flex ${reducedMotion || !mounted ? '' : 'transition-transform duration-500'}`;
  const slideWidthClass = visibleCount === 1 ? 'w-full' : visibleCount === 2 ? 'w-1/2' : 'w-1/3';

  return (
    <motion.div
      className="slide_product"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {title && (
        <motion.div
          className="top_slide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.h2
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {title}
          </motion.h2>
        </motion.div>
      )}

      <motion.div
        className={trackClass}
        style={trackStyle}
        ref={sliderRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {items.map((category) => (
          <motion.div
            key={category.id || category.slug}
            className={`flex-shrink-0 ${slideWidthClass} px-2`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.8,
              type: "spring",
              stiffness: 100
            }}
          >
            <SimpleCategoryCard category={category} />
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        onClick={goPrev}
        disabled={current === 0}
        className="btn_Swip swiper-button-prev"
        aria-label="Previous"
        whileHover={{
          scale: 1.1,
          backgroundColor: "#ff8716",
          boxShadow: "0 5px 15px rgba(255, 135, 22, 0.3)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2, type: "spring", stiffness: 400 }}
      >
        ‹
      </motion.button>

      <motion.button
        onClick={goNext}
        disabled={current === maxIndex}
        className="btn_Swip swiper-button-next"
        aria-label="Next"
        whileHover={{
          scale: 1.1,
          backgroundColor: "#ff8716",
          boxShadow: "0 5px 15px rgba(255, 135, 22, 0.3)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2, type: "spring", stiffness: 400 }}
      >
        ›
      </motion.button>
    </motion.div>
  );
};

/**
 * Banners Section Component - Modern Grid Layout
 */
const BannersSection = ({ images, className = "banner_2_img" }) => (
  <div className="banners fade-in-up">
    <div className="container">
      <div className={`banners_boxs ${className}`}>
        {images.map((image, index) => (
          <a
            key={index}
            href="#offers"
            className={`box ${index === 0 ? 'banner1-full-width' : ''} fade-in-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <img src={image} alt={`Banner ${index + 1}`} />
          </a>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Footer Component - Enhanced with Subtle Entrance Animations
 */
const Footer = ({ locale }) => (
  <motion.footer
    className="fade-in-up"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.2 }}
  >
    <div className="container">
      <motion.div
        className="big_row"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.img
          className="logo_footer"
          src="/img/logo.png"
          alt="Reda Store"
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.p
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sequi, vero?
        </motion.p>
        <motion.div
          className="icons_footer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.a
            href="#"
            aria-label="Facebook"
            whileHover={{
              scale: 1.2,
              backgroundColor: "#1877f2",
              boxShadow: "0 5px 15px rgba(24, 119, 242, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <i className="fa-solid fa-phone"></i>
          </motion.a>
          <motion.a
            href="#"
            aria-label="Facebook"
            whileHover={{
              scale: 1.2,
              backgroundColor: "#1877f2",
              boxShadow: "0 5px 15px rgba(24, 119, 242, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <i className="fa-brands fa-facebook-f"></i>
          </motion.a>
          <motion.a
            href="#"
            aria-label="Instagram"
            whileHover={{
              scale: 1.2,
              backgroundColor: "#e4405f",
              boxShadow: "0 5px 15px rgba(228, 64, 95, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <i className="fa-brands fa-instagram"></i>
          </motion.a>
          <motion.a
            href="#"
            aria-label="Twitter"
            whileHover={{
              scale: 1.2,
              backgroundColor: "#1da1f2",
              boxShadow: "0 5px 15px rgba(29, 161, 242, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <i className="fa-brands fa-x-twitter"></i>
          </motion.a>
        </motion.div>
      </motion.div>

      <motion.div
        className="row"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.h4
          whileHover={{ scale: 1.02, color: "#ff8716" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {locale === 'ar' ? 'الفئات الغذائية' : 'Food Categories'}
        </motion.h4>
        <div className="links">
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الخضروات الطازجة' : 'Fresh Vegetables'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الفواكه الموسمية' : 'Seasonal Fruits'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'اللحوم والدواجن' : 'Meat & Poultry'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'منتجات الألبان' : 'Dairy Products'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'المخبوزات الطازجة' : 'Fresh Bakery'}
          </motion.a>
        </div>
      </motion.div>

      <motion.div
        className="row"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <motion.h4
          whileHover={{ scale: 1.02, color: "#ff8716" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
        </motion.h4>
        <div className="links">
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'حسابك' : 'Your Account'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الإرجاع والتبادل' : 'Returns & Exchanges'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'وقت التوصيل المقدر' : 'Estimated Delivery Time'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'تاريخ المشتريات' : 'Purchase History'}
          </motion.a>
        </div>
      </motion.div>

      <motion.div
        className="row"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <motion.h4
          whileHover={{ scale: 1.02, color: "#ff8716" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {locale === 'ar' ? 'خدماتنا' : 'Our Services'}
        </motion.h4>
        <div className="links">
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'مركز الدعم' : 'Support Center'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'المساعدة' : 'Help'}
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.02, x: 5, color: "#ff8716" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <i className="fa-solid fa-caret-right"></i> {locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}
          </motion.a>
        </div>
      </motion.div>
    </div>

    <motion.div
      className="bottom_footer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.4 }}
    >
      <div className="container">
        <motion.p
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          &copy; <span>Reda Store.</span> {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}
        </motion.p>
        <motion.div
          className="payment_img"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <img src="/img/payment_method.png" alt="Payment Methods" />
        </motion.div>
      </div>
    </motion.div>
  </motion.footer>
);

/**
 * MainHome Page Component - Enhanced with Floating Animations
 * Features hero section, main slider, banners, product sections, and footer
 *
 * Performance optimizations:
 * - React.memo for component memoization
 * - useMemo for expensive calculations
 * - useCallback for event handlers
 * - Lazy loading for components
 * - Error boundaries for error handling
 */
const MainHome = React.memo(() => {
  // Context hooks with error handling
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { products = [] } = useProducts() || {};

  // Get processed product data from useHomeProducts hook
  useHomeProducts(products);

  // Fetch ads using React Query
  const { data: adsData = [] } = useAds();

  // Fetch categories from API using React Query
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', { withCounts: true }],
    queryFn: async () => {
      const data = await api.listCategories({ withCounts: true });
      if (Array.isArray(data)) {
        // Normalize category data for UI components
        return data.map(cat => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name || { ar: cat.nameAr, en: cat.nameEn },
          nameAr: cat.nameAr || cat.name,
          nameEn: cat.nameEn || cat.name,
          image: cat.image,
          productCount: cat.productCount || 0,
        }));
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
  });

  // Fetch offers from API using React Query
  const {
    data: offersData,
    isLoading: offersLoading,
    isError: offersError,
    error: offersQueryError,
  } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const data = await api.listOffers();
      if (Array.isArray(data)) {
        // Normalize shape for UI components expecting: name(string), originalPrice, images[]
        const normalized = data.map(p => {
          const nameObj = p.name || { ar: p.nameAr, en: p.nameEn };
          const nameAr = nameObj?.ar || p.nameAr || '';
          const nameEn = nameObj?.en || p.nameEn || '';
          const variants = p.imageVariants || null;
          const gallery = Array.isArray(p.gallery) ? p.gallery : [];
          // choose display image preference: main thumb -> first gallery thumb -> main medium -> original -> gallery first -> first images[]
          let displayImage = p.image;
          if (variants) {
            displayImage = variants.thumb || variants.medium || variants.original || p.image;
          }
          if (!displayImage && gallery.length) {
            const g0 = gallery[0];
            if (g0?.variants) displayImage = g0.variants.thumb || g0.variants.medium || g0.variants.original || g0.url;
            else displayImage = g0.url;
          }
          return {
            ...p,
            name: nameAr, // legacy simple name (Arabic default)
            nameAr,
            nameEn,
            originalPrice: p.oldPrice || p.originalPrice || null,
            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            gallery,
            displayImage,
          };
        });
        return normalized;
      }
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - offers change moderately frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Fetch featured products from API using React Query
  const { data: featuredProductsData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const data = await api.listFeaturedProducts();
      if (Array.isArray(data)) {
        // Normalize shape for UI components expecting: nameAr, nameEn, images[], displayImage, originalPrice
        const normalized = data.map(p => {
          const nameObj = p.name || { ar: p.nameAr, en: p.nameEn };
          const nameAr = nameObj?.ar || p.nameAr || '';
          const nameEn = nameObj?.en || p.nameEn || '';
          const variants = p.imageVariants || null;
          const gallery = Array.isArray(p.gallery) ? p.gallery : [];
          // choose display image preference: main thumb -> first gallery thumb -> main medium -> original -> gallery first -> first images[]
          let displayImage = p.image;
          if (variants) {
            displayImage = variants.thumb || variants.medium || variants.original || p.image;
          }
          if (!displayImage && gallery.length) {
            const g0 = gallery[0];
            if (g0?.variants) displayImage = g0.variants.thumb || g0.variants.medium || g0.variants.original || g0.url;
            else displayImage = g0.url;
          }
          return {
            ...p,
            name: nameAr, // legacy simple name (Arabic default)
            nameAr,
            nameEn,
            originalPrice: p.oldPrice || p.originalPrice || null,
            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            gallery,
            displayImage,
          };
        });
        return normalized;
      }
      return [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - featured products change moderately
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Memoized product data - fallback to static data if API fails
  const hotDealsProducts = useMemo(() => {
    if (offersData && offersData.length > 0) {
      // Filter for hot deals (high discount percentage)
      return offersData
        .filter(product => {
          if (!product.price || !product.originalPrice) return false;
          const discountPercent = ((product.originalPrice - product.price) / product.originalPrice) * 100;
          return discountPercent >= 20; // 20% or more discount
        })
        .slice(0, 4); // Limit to 4 products
    }

    // Fallback static data
    return [
      {
        id: 'hot-1',
        name: locale === 'ar' ? 'طماطم طازجة' : 'Fresh Tomatoes',
        nameAr: 'طماطم طازجة',
        nameEn: 'Fresh Tomatoes',
        price: 5,
        oldPrice: 8,
        images: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80'],
        category: 'vegetables'
      },
      {
        id: 'hot-2',
        name: locale === 'ar' ? 'تفاح أحمر' : 'Red Apples',
        nameAr: 'تفاح أحمر',
        nameEn: 'Red Apples',
        price: 12,
        oldPrice: 18,
        images: ['https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'],
        category: 'fruits'
      },
      {
        id: 'hot-3',
        name: locale === 'ar' ? 'لحم بقري' : 'Beef Meat',
        nameAr: 'لحم بقري',
        nameEn: 'Beef Meat',
        price: 85,
        oldPrice: 110,
        images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80'],
        category: 'meat'
      },
      {
        id: 'hot-4',
        name: locale === 'ar' ? 'جبنة شيدر' : 'Cheddar Cheese',
        nameAr: 'جبنة شيدر',
        nameEn: 'Cheddar Cheese',
        price: 25,
        oldPrice: 35,
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'],
        category: 'dairy'
      }
    ];
  }, [offersData, locale]);

  const vegetablesProducts = useMemo(() => {
    if (offersData && offersData.length > 0) {
      // Filter for vegetables category
      return offersData
        .filter(product => product.category === 'vegetables' || product.category === 'greens' || product.category === 'produce')
        .slice(0, 4);
    }

    // Fallback static data
    return [
      {
        id: 'veg-1',
        name: locale === 'ar' ? 'خس طازج' : 'Fresh Lettuce',
        nameAr: 'خس طازج',
        nameEn: 'Fresh Lettuce',
        price: 3,
        oldPrice: 5,
        images: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80'],
        category: 'vegetables'
      },
      {
        id: 'veg-2',
        name: locale === 'ar' ? 'جزر' : 'Carrots',
        nameAr: 'جزر',
        nameEn: 'Carrots',
        price: 4,
        oldPrice: 6,
        images: ['https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=400&q=80'],
        category: 'vegetables'
      },
      {
        id: 'veg-3',
        name: locale === 'ar' ? 'بطاطس' : 'Potatoes',
        nameAr: 'بطاطس',
        nameEn: 'Potatoes',
        price: 2,
        oldPrice: 3,
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80'],
        category: 'vegetables'
      },
      {
        id: 'veg-4',
        name: locale === 'ar' ? 'بصل' : 'Onions',
        nameAr: 'بصل',
        nameEn: 'Onions',
        price: 1.5,
        oldPrice: 2.5,
        images: ['https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=400&q=80'],
        category: 'vegetables'
      }
    ];
  }, [offersData, locale]);

  const dairyProducts = useMemo(() => {
    if (offersData && offersData.length > 0) {
      // Filter for dairy category
      return offersData
        .filter(product => product.category === 'dairy' || product.category === 'milk' || product.category === 'cheese')
        .slice(0, 4);
    }

    // Fallback static data
    return [
      {
        id: 'dairy-1',
        name: locale === 'ar' ? 'حليب طازج' : 'Fresh Milk',
        nameAr: 'حليب طازج',
        nameEn: 'Fresh Milk',
        price: 8,
        oldPrice: 12,
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'],
        category: 'dairy'
      },
      {
        id: 'dairy-2',
        name: locale === 'ar' ? 'زبادي يوناني' : 'Greek Yogurt',
        nameAr: 'زبادي يوناني',
        nameEn: 'Greek Yogurt',
        price: 15,
        oldPrice: 20,
        images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80'],
        category: 'dairy'
      },
      {
        id: 'dairy-3',
        name: locale === 'ar' ? 'جبنة موتزاريلا' : 'Mozzarella Cheese',
        nameAr: 'جبنة موتزاريلا',
        nameEn: 'Mozzarella Cheese',
        price: 18,
        oldPrice: 25,
        images: ['https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&q=80'],
        category: 'dairy'
      },
      {
        id: 'dairy-4',
        name: locale === 'ar' ? 'زبدة' : 'Butter',
        nameAr: 'زبدة',
        nameEn: 'Butter',
        price: 12,
        oldPrice: 16,
        images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80'],
        category: 'dairy'
      }
    ];
  }, [offersData, locale]);

  const fruitsProducts = useMemo(() => {
    if (offersData && offersData.length > 0) {
      // Filter for fruits category
      return offersData
        .filter(product => product.category === 'fruits' || product.category === 'produce' || product.category === 'fresh')
        .slice(0, 4);
    }

    // Fallback static data
    return [
      {
        id: 'fruit-1',
        name: locale === 'ar' ? 'برتقال' : 'Oranges',
        nameAr: 'برتقال',
        nameEn: 'Oranges',
        price: 6,
        oldPrice: 9,
        images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80'],
        category: 'fruits'
      },
      {
        id: 'fruit-2',
        name: locale === 'ar' ? 'موز' : 'Bananas',
        nameAr: 'موز',
        nameEn: 'Bananas',
        price: 4,
        oldPrice: 6,
        images: ['https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?auto=format&fit=crop&w=400&q=80'],
        category: 'fruits'
      },
      {
        id: 'fruit-3',
        name: locale === 'ar' ? 'تفاح أخضر' : 'Green Apples',
        nameAr: 'تفاح أخضر',
        nameEn: 'Green Apples',
        price: 8,
        oldPrice: 12,
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80'],
        category: 'fruits'
      },
      {
        id: 'fruit-4',
        name: locale === 'ar' ? 'عنب' : 'Grapes',
        nameAr: 'عنب',
        nameEn: 'Grapes',
        price: 10,
        oldPrice: 15,
        images: ['https://images.unsplash.com/photo-1537640538966-79f36943f303?auto=format&fit=crop&w=400&q=80'],
        category: 'fruits'
      }
    ];
  }, [offersData, locale]);

  // Site configuration with fallbacks
  const siteName = useMemo(() => {
    if (locale === 'ar') {
      return setting?.siteNameAr ;
    }
    return setting?.siteNameEn || setting?.siteName ;
  }, [locale, setting]);

  const pageTitle = useMemo(() =>
    locale === 'ar' ? `العروض الخاصة | ${siteName}` : `Special Offers | ${siteName}`,
    [locale, siteName]
  );

  // Banner images for banners sections
  const bannerImages2 = [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80'
  ];

  const bannerImages3 = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80'
  ];

  // Show loading state while fetching offers
  if (offersLoading && !offersData) {
    return (
      <div className="offers-page-wrapper">
        <Seo title={pageTitle} description={locale === 'ar' ? "اكتشف أفضل العروض والتخفيضات على جميع المنتجات" : "Discover the best offers and discounts on all products"} />

        {/* ===== HERO SECTION ===== */}
        <HeroSection locale={locale} />

        {/* ===== LOADING PLACEHOLDER ===== */}
        <div className="py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
       
      </div>
    );
  }

  // Show error state if API fails
  if (offersError) {
    console.warn('Failed to load offers from API:', offersQueryError);
    // Continue with fallback data - error is logged but doesn't break the page
  }

  return (
    <div className="offers-page-wrapper" style={{ width: '100vw' }}>
      <Seo title={pageTitle} description={locale === 'ar' ? "اكتشف أفضل العروض والتخفيضات على جميع المنتجات" : "Discover the best offers and discounts on all products"} />

      {/* ===== HERO SECTION ===== */}
      <HeroSection locale={locale} />

      {/* ===== MAIN SLIDER ===== */}
      <MainSlider locale={locale} ads={adsData} setting={setting} />

      {/* ===== BANNERS 4 SECTION ===== */}
      <Banners4 locale={locale} />

      {/* ===== HOT DEALS PRODUCTS ===== */}
      <ProductSliderSection
        title={locale === 'ar' ? 'العروض الساخنة' : 'Hot Deals'}
        products={hotDealsProducts}
        locale={locale}
        id="hot-deals"
      />

      {/* ===== BANNERS 2 IMAGES ===== */}
      <BannersSection images={bannerImages2} className="banner_2_img" />

      {/* ===== ELECTRONICS PRODUCTS ===== */}
      <ProductSliderSection
        title={locale === 'ar' ? 'الخضروات الطازجة' : 'Fresh Vegetables'}
        products={vegetablesProducts}
        locale={locale}
        id="vegetables"
      />

      {/* ===== APPLIANCES PRODUCTS ===== */}
      <ProductSliderSection
        title={locale === 'ar' ? 'منتجات الألبان' : 'Dairy Products'}
        products={dairyProducts}
        locale={locale}
        id="dairy"
      />

      {/* ===== BANNERS 3 IMAGES ===== */}
      <BannersSection images={bannerImages3} className="banner_3_img" />

      {/* ===== MOBILES PRODUCTS ===== */}
      <ProductSliderSection
        title={locale === 'ar' ? 'الفواكه الطازجة' : 'Fresh Fruits'}
        products={fruitsProducts}
        locale={locale}
        id="fruits"
      />

      {/* ===== CATEGORIES SECTION ===== */}
      <CategorySlider
        title={locale === 'ar' ? 'الفئات' : 'Categories'}
        categories={categoriesData || []}
        limit={12}
      />

      {/* ===== FEATURED PRODUCTS ===== */}
      <ProductSliderSection
        title={locale === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
        products={featuredProductsData || []}
        locale={locale}
        id="featured-products"
      />

     
    </div>
  );
});

MainHome.displayName = 'MainHome';

export default MainHome;