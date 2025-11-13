import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy.js';
import { resolveLocalized } from '../../utils/locale';
import { useLanguage } from '../../stores/LanguageContext';
import SafeImage from '../common/SafeImage';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/client';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './CatalogSection.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' }
  }),
};

const CatalogSection = ({ title, onSelect, selected }) => {
  const { locale } = useLanguage();
  const swiperRef = useRef(null);

  // Fetch products from API with improved caching
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsQueryError,
  } = useQuery({
    queryKey: ['products', { pageSize: 20 }],
    queryFn: async () => {
      const data = await api.searchProducts({ pageSize: 20 });
      if (Array.isArray(data)) {
        // Normalize product data for UI components
        return data.map(product => ({
          id: product.id,
          slug: product.slug,
          name: product.name || { ar: product.nameAr, en: product.nameEn },
          nameAr: product.nameAr || product.name,
          nameEn: product.nameEn || product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images || [],
          image: product.image || (product.images && product.images[0]),
          category: product.category,
          isFeatured: product.isFeatured,
          inStock: product.inStock,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
        }));
      }
      return [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use API data or fallback to empty array
  let products = useMemo(() => productsData || [], [productsData]);

  useEffect(() => {
    if (products.length >= 3 && swiperRef.current) {
      const swiper = new Swiper(swiperRef.current, {
        modules: [Pagination, Autoplay],
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 20,
        grabCursor: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        loop: true,
        speed: 800,
        pagination: {
          el: '.catalog-pagination',
          clickable: true,
          dynamicBullets: true,
        },
        on: {
          slideChange: function () {
            // Add scale effect to active slide
            const slides = this.slides;
            slides.forEach((slide, index) => {
              if (index === this.activeIndex) {
                slide.style.transform = 'scale(1.1)';
                slide.style.zIndex = '10';
              } else if (index === this.activeIndex - 1 || index === this.activeIndex + 1) {
                slide.style.transform = 'scale(0.9)';
                slide.style.zIndex = '5';
              } else {
                slide.style.transform = 'scale(0.8)';
                slide.style.zIndex = '1';
              }
            });
          },
        },
        breakpoints: {
          320: {
            slidesPerView: 'auto',
            spaceBetween: 15,
            centeredSlides: true,
          },
          480: {
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: true,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
            centeredSlides: false,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 25,
            centeredSlides: false,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 30,
            centeredSlides: false,
          },
          1280: {
            slidesPerView: 5,
            spaceBetween: 35,
            centeredSlides: false,
          },
        },
      });

      // Initial scale effect
      setTimeout(() => {
        const activeSlide = swiper.slides[swiper.activeIndex];
        if (activeSlide) {
          activeSlide.style.transform = 'scale(1.1)';
          activeSlide.style.zIndex = '10';
        }
      }, 100);

      return () => {
        if (swiper) {
          swiper.destroy();
        }
      };
    }
  }, [products]);

  // Show loading state with improved design
  if (productsLoading) {
    return (
      <section className="catalog-section my-12">
        <div className="container-fixed px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (productsError) {
    console.warn('Failed to load products from API:', productsQueryError);
    return (
      <section className="catalog-section my-12">
        <div className="container-fixed px-4 py-6">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm mb-4">
              {locale === 'ar' ? 'فشل في تحميل المنتجات' : 'Failed to load products'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {locale === 'ar' ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <section className="catalog-section my-12">
        <div className="container-fixed px-4 py-6">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm mb-4">
              {locale === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {locale === 'ar' ? 'لم يتم العثور على أي منتجات' : 'No products found'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="catalog-section my-12"
      aria-label={title || (locale === 'ar' ? 'الكتالوج' : 'Catalog')}
    >
      <div className="container-fixed px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm">
            {title || (locale === 'ar' ? 'الكتالوج' : 'Catalog')}
          </h3>
        </div>

        {/* Products Slider */}
        {products.length >= 3 ? (
          <div className="relative">
            <div ref={swiperRef} className="swiper catalog-swiper">
              <div className="swiper-wrapper">
                {products.map((product, index) => {
                  const name = resolveLocalized(product.name, locale) || product.slug;
                  const price = product.price;
                  const originalPrice = product.originalPrice;
                  const hasDiscount = originalPrice && originalPrice > price;

                  return (
                    <div key={product.id || product.slug} className="swiper-slide">
                      <motion.div
                        variants={fadeInUp}
                        custom={index}
                        className="h-full"
                      >
                        <div className="group relative block w-full rounded-2xl overflow-hidden border transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 h-full bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105">
                          <div className="aspect-square w-full bg-gray-100 relative overflow-hidden rounded-t-2xl">
                            <SafeImage
                              src={product.image || '/images/product-placeholder.jpg'}
                              alt={name}
                              loading="lazy"
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

                            {/* Featured badge */}
                            {product.isFeatured && (
                              <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold rounded-full px-2 py-1 shadow-md">
                                {locale === 'ar' ? 'مميز' : 'Featured'}
                              </span>
                            )}

                            {/* Out of stock overlay */}
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                  {locale === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate mb-2">{name}</h4>

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                  {price} {locale === 'ar' ? 'ر.س' : 'SAR'}
                                </span>
                                {hasDiscount && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {originalPrice} {locale === 'ar' ? 'ر.س' : 'SAR'}
                                  </span>
                                )}
                              </div>

                              {/* Rating */}
                              {product.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-400">★</span>
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {product.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => onSelect && onSelect(product.slug)}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                              {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              <div className="catalog-pagination mt-8"></div>
            </div>
          </div>
        ) : (
          // Fallback to grid if less than 3 products
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {products.map((product, i) => {
              const name = resolveLocalized(product.name, locale) || product.slug;
              const price = product.price;
              const originalPrice = product.originalPrice;
              const hasDiscount = originalPrice && originalPrice > price;

              return (
                <motion.div key={product.id || product.slug} role="listitem" variants={fadeInUp} custom={i}>
                  <div className="group relative block w-full rounded-2xl overflow-hidden border transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105">
                    <div className="aspect-square w-full bg-gray-100 relative overflow-hidden rounded-t-2xl">
                      <SafeImage
                        src={product.image || '/images/product-placeholder.jpg'}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

                      {/* Featured badge */}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold rounded-full px-2 py-1 shadow-md">
                          {locale === 'ar' ? 'مميز' : 'Featured'}
                        </span>
                      )}

                      {/* Out of stock overlay */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                            {locale === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate mb-2">{name}</h4>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {price} {locale === 'ar' ? 'ر.س' : 'SAR'}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              {originalPrice} {locale === 'ar' ? 'ر.س' : 'SAR'}
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onSelect && onSelect(product.slug)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CatalogSection;