import React, { useEffect, useRef } from 'react';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './FeaturedProductsSection.css';
import ProductCard from '../shared/ProductCard';

/**
 * FeaturedProductsSection Component - Displays featured products in a carousel slider
 */
const FeaturedProductsSection = ({ products = [], Motion, containerVariants, itemVariants, t, locale }) => {
  const swiperRef = useRef(null);

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
          el: '.featured-pagination',
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
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: true,
          },
          768: {
            slidesPerView: 'auto',
            spaceBetween: 25,
            centeredSlides: true,
          },
          1024: {
            slidesPerView: 5,
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

  if (!products.length) return null;

  const MotionDiv = Motion?.div || 'div';

  return (
    <section className="featured-products py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('featuredProducts') || 'منتجات مميزة'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {locale === 'ar' ? 'اكتشف منتجاتنا الأكثر شعبية ومبيعاً' : 'Discover our most popular and best-selling products'}
          </p>
        </MotionDiv>

        {/* Products Slider */}
        {products.length >= 3 ? (
          <div className="relative">
            <div ref={swiperRef} className="swiper featured-swiper">
              <div className="swiper-wrapper">
                {products.map((product, index) => (
                  <div key={product.id || index} className="swiper-slide">
                    <MotionDiv variants={itemVariants} className="h-full">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out border border-gray-100 dark:border-gray-700 overflow-hidden h-full transform hover:scale-105">
                        <ProductCard
                          product={product}
                          className="border-0 shadow-none hover:shadow-none h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                      </div>
                    </MotionDiv>
                  </div>
                ))}
              </div>
              <div className="featured-pagination mt-8"></div>
            </div>
          </div>
        ) : (
          // Fallback to grid if less than 3 products
          <MotionDiv
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {products.map((product) => (
              <MotionDiv key={product.id} variants={itemVariants}>
                <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-700">
                  <ProductCard product={product} className="border-0 shadow-none hover:shadow-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsSection;