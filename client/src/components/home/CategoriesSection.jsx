import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy.js';
import { resolveLocalized } from '../../utils/locale';
import { useLanguage } from '../../stores/LanguageContext';
import SafeImage from '../common/SafeImage';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/client';
import useCategories from '../../hooks/useCategories';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './CategoriesSection.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 50, scale: 0.8, rotateX: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for bounce effect
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }),
};

const slideInFromSide = {
  hidden: (i) => ({
    opacity: 0,
    x: i % 2 === 0 ? -100 : 100,
    scale: 0.9,
    rotateY: i % 2 === 0 ? -15 : 15
  }),
  visible: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: "easeOut",
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  }),
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.3, y: 100 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.68, -0.55, 0.265, 1.55], // Bounce easing
      type: "spring",
      stiffness: 200,
      damping: 12
    }
  }),
};

const elasticScale = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.8,
      ease: "easeOut",
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }),
};

const CategoriesSectionModern = ({ title, onSelect, selected }) => {
  const { locale } = useLanguage();
  const swiperRef = useRef(null);

  // Array of different animations for variety
  const animations = [fadeInUp, slideInFromSide, bounceIn, elasticScale];

  // Fetch categories from API with improved caching
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesQueryError,
  } = useCategories({ withCounts: true });

  // Use API data or fallback to empty array
  let categories = useMemo(() => categoriesData || [], [categoriesData]);

  useEffect(() => {
    if (categories.length >= 3 && swiperRef.current) {
      const swiper = new Swiper(swiperRef.current, {
        modules: [Pagination, Autoplay],
        centeredSlides: false,
        slidesPerView: 5,
        spaceBetween: 10,
        grabCursor: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        loop: true,
        speed: 800,
        pagination: {
          el: '.categories-pagination',
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
            slidesPerView: 5,
            spaceBetween: 3,
            centeredSlides: false,
          },
          480: {
            slidesPerView: 5,
            spaceBetween: 1,
            centeredSlides: false,
          },
          640: {
            slidesPerView: 5,
            spaceBetween: 2,
            centeredSlides: false,
          },
          768: {
            slidesPerView: 5,
            spaceBetween: 2,
            centeredSlides: false,
          },
          1024: {
            slidesPerView: 6,
            spaceBetween: 16,
            centeredSlides: false,
          },
          1280: {
            slidesPerView: 7,
            spaceBetween: 2,
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
  }, [categories]);

  // Show loading state with improved design
  if (categoriesLoading) {
    return (
      <section className="categories-section-modern my-12">
        <div className="container-fixed px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
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
  if (categoriesError) {
    console.warn('Failed to load categories from API:', categoriesQueryError);
    return (
      <section className="categories-section-modern my-12">
        <div className="container-fixed px-4 py-6">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm mb-4">
              {locale === 'ar' ? 'فشل في تحميل الفئات' : 'Failed to load categories'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {locale === 'ar' ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <section className="categories-section-modern my-12">
        <div className="container-fixed px-4 py-6">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm mb-4">
              {locale === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {locale === 'ar' ? 'لم يتم العثور على أي فئات في قاعدة البيانات' : 'No categories found in the database'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="categories-section-modern categories-section my-12"
      aria-label={title || (locale === 'ar' ? 'الاقسام  ' : 'Browse by Category')}
    >
      <div className="container-fixed px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm">
            {title || (locale === 'ar' ? 'الاقسام' : 'Browse by Category')}
          </h3>
        </div>

        {/* Categories Slider */}
        {categories.length >= 3 ? (
          <div className="relative">
            <div ref={swiperRef} className="swiper categories-swiper">
              <div className="swiper-wrapper">
                {categories.map((cat, index) => {
                  const name = resolveLocalized(cat.name, locale) || cat.slug;
                  const isActive = selected === cat.slug;

                  return (
                    <div key={cat.id || cat.slug} className="swiper-slide">
                      <motion.div
                        variants={animations[index % animations.length]}
                        custom={index}
                        className="h-full"
                        whileHover={{
                          scale: 1.05,
                          rotateY: 5,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => onSelect && onSelect(cat.slug)}
                          className={`group relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                            ${isActive ? 'ring-2 ring-emerald-500 shadow-2xl scale-105' : 'hover:shadow-xl hover:scale-105'}`}
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gray-100 relative overflow-hidden rounded-full mb-3 shadow-md group-hover:shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                            <SafeImage
                              src={cat.image || '/images/category-placeholder.jpg'}
                              alt={name}
                              loading="lazy"
                              className="w-full h-full object-cover transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-full group-hover:from-emerald-500/30 transition-all duration-500" />
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full transition-all duration-500"></div>
                          </div>
                          <div className="text-center transform group-hover:translate-y-1 transition-transform duration-300">
                            <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate max-w-20 sm:max-w-24 md:max-w-28 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{name}</div>
                            {typeof cat.productCount !== 'undefined' && (
                              <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 group-hover:text-emerald-500 transition-colors duration-300">
                                {cat.productCount} {locale === 'ar' ? 'منتج' : 'items'}
                              </div>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              <div className="categories-pagination mt-8"></div>
            </div>
          </div>
        ) : (
          // Fallback to grid if less than 3 categories
          <motion.div
            className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {categories.map((cat, i) => {
              const name = resolveLocalized(cat.name, locale) || cat.slug;
              const isActive = selected === cat.slug;

              return (
                <motion.div key={cat.id || cat.slug} role="listitem" variants={animations[i % animations.length]} custom={i}>
                  <button
                    onClick={() => onSelect && onSelect(cat.slug)}
                    className={`group relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                      ${isActive ? 'ring-2 ring-emerald-500 shadow-2xl scale-105' : 'hover:shadow-xl hover:scale-105'}`}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gray-100 relative overflow-hidden rounded-full mb-3 shadow-md group-hover:shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                      <SafeImage
                        src={cat.image || '/images/category-placeholder.jpg'}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-full group-hover:from-emerald-500/30 transition-all duration-500" />
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full transition-all duration-500"></div>
                    </div>
                    <div className="text-center transform group-hover:translate-y-1 transition-transform duration-300">
                      <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate max-w-20 sm:max-w-24 md:max-w-28 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{name}</div>
                      {typeof cat.productCount !== 'undefined' && (
                        <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 group-hover:text-emerald-500 transition-colors duration-300">
                          {cat.productCount} {locale === 'ar' ? 'منتج' : 'items'}
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSectionModern;
