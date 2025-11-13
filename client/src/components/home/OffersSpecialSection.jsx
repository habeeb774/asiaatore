import React from 'react';
import { motion } from '../../lib/framerLazy';
import ProductCard from '../shared/ProductCard';
import Carousel from '../ui/Carousel';
import { Sparkles, Crown, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/client';
import './OffersSpecialSection.css';

/**
 * OffersSpecialSection Component - Displays special luxury offers in a unique slider
 */
const OffersSpecialSection = ({
  products = [],
  title = "عروض فاخرة",
  subtitle = "اكتشف أفضل العروض والخصومات الفاخرة",
  Motion = motion,
  t,
  locale
}) => {
  const MotionDiv = Motion?.div || 'div';
  // Fetch special offers using React Query
  const {
    data: specialOffers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['special-offers'],
    queryFn: async () => {
      try {
        const data = await api.listOffers();
        if (Array.isArray(data)) {
          // Normalize offers data similar to products
          return data.map(offer => ({
            ...offer,
            name: offer.nameAr || offer.name || '',
            nameAr: offer.nameAr || offer.name || '',
            nameEn: offer.nameEn || offer.name || '',
            originalPrice: offer.oldPrice || offer.originalPrice || null,
            images: Array.isArray(offer.images) ? offer.images : (offer.image ? [offer.image] : []),
            displayImage: offer.image || offer.displayImage,
            discount: offer.discount || 0,
            isSpecialOffer: true
          }));
        }
        return [];
      } catch (err) {
        console.warn('Failed to load special offers, falling back to filtered products:', err);
        // Fallback: filter products for offers
        return products.filter(product =>
          product.discount > 0 ||
          product.isSpecialOffer ||
          (product.price && product.originalPrice && product.price < product.originalPrice)
        ).slice(0, 8);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2
  });

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-orange-200 rounded w-96 mx-auto mb-8"></div>
            <div className="flex justify-center gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-80 h-96 bg-white rounded-2xl shadow-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no offers and no error (to avoid empty sections)
  if (!specialOffers || specialOffers.length === 0) {
    // Fallback: show some sample offers for demo purposes
    const sampleOffers = [
      {
        id: 'sample-1',
        slug: 'sample-offer-1',
        name: 'عرض خاص على زيت الزيتون',
        nameAr: 'عرض خاص على زيت الزيتون',
        nameEn: 'Special Offer on Olive Oil',
        price: 38.5,
        originalPrice: 45,
        discount: 15,
        image: 'https://via.placeholder.com/400x400?text=Olive+Oil+Offer',
        images: ['https://via.placeholder.com/400x400?text=Olive+Oil+Offer'],
        displayImage: 'https://via.placeholder.com/400x400?text=Olive+Oil+Offer',
        isSpecialOffer: true
      },
      {
        id: 'sample-2',
        slug: 'sample-offer-2',
        name: 'خصم على العسل الطبيعي',
        nameAr: 'خصم على العسل الطبيعي',
        nameEn: 'Discount on Natural Honey',
        price: 28,
        originalPrice: 32,
        discount: 12,
        image: 'https://via.placeholder.com/400x400?text=Honey+Offer',
        images: ['https://via.placeholder.com/400x400?text=Honey+Offer'],
        displayImage: 'https://via.placeholder.com/400x400?text=Honey+Offer',
        isSpecialOffer: true
      },
      {
        id: 'sample-3',
        slug: 'sample-offer-3',
        name: 'عرض على الشاي الأخضر',
        nameAr: 'عرض على الشاي الأخضر',
        nameEn: 'Green Tea Special Offer',
        price: 19.9,
        originalPrice: 24,
        discount: 17,
        image: 'https://via.placeholder.com/400x400?text=Green+Tea+Offer',
        images: ['https://via.placeholder.com/400x400?text=Green+Tea+Offer'],
        displayImage: 'https://via.placeholder.com/400x400?text=Green+Tea+Offer',
        isSpecialOffer: true
      }
    ];

    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10">
            <Crown className="w-20 h-20 text-amber-500" />
          </div>
          <div className="absolute bottom-10 right-10">
            <Sparkles className="w-16 h-16 text-orange-500" />
          </div>
          <div className="absolute top-1/2 left-1/4">
            <Star className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <MotionDiv
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Crown className="w-8 h-8 text-amber-600" />
              </MotionDiv>
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                عروض فاخرة
              </h2>
              <MotionDiv
                animate={{
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Sparkles className="w-8 h-8 text-orange-600" />
              </MotionDiv>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              اكتشف أفضل العروض والخصومات الفاخرة على منتجاتنا المميزة
            </p>
          </MotionDiv>

          {/* Special Offers Slider */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <Carousel
              items={sampleOffers}
              renderItem={(product, index, current) => (
                <MotionDiv
                  key={product.id}
                  className={`flex-shrink-0 w-full sm:w-80 px-3 py-4 transform transition-all duration-500 ${
                    index === current
                      ? 'scale-105 z-10'
                      : 'scale-95 opacity-80'
                  }`}
                  whileHover={{
                    scale: index === current ? 1.05 : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 overflow-hidden offers-special-glow">
                    {/* Special offer badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <MotionDiv
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 special-offer-badge"
                      >
                        <Sparkles className="w-4 h-4" />
                        عرض خاص
                      </MotionDiv>
                    </div>

                    {/* Discount percentage badge */}
                    {product.discount > 0 && (
                      <div className="absolute top-4 left-4 z-20">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          -{product.discount}%
                        </div>
                      </div>
                    )}

                    <ProductCard
                      product={product}
                      className="border-0 shadow-none hover:shadow-none"
                      variant="special"
                    />

                    {/* Luxury overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                    {/* Animated border */}
                    <MotionDiv
                      className="absolute inset-0 rounded-2xl border-2 border-transparent"
                      animate={{
                        borderColor: [
                          'rgba(245, 158, 11, 0)',
                          'rgba(245, 158, 11, 0.5)',
                          'rgba(245, 158, 11, 0)'
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </MotionDiv>
              )}
              visibleCount={3}
              centerMode={true}
              autoplay={true}
              interval={5000}
              pauseOnHover={true}
              showArrows={true}
              showDots={true}
              dotSize="medium"
              className="special-offers-carousel"
            />
          </MotionDiv>

          {/* Call to action */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
            >
              <Crown className="w-5 h-5" />
              عرض جميع العروض الفاخرة
              <Sparkles className="w-5 h-5" />
            </motion.button>
          </MotionDiv>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10">
          <Crown className="w-20 h-20 text-amber-500" />
        </div>
        <div className="absolute bottom-10 right-10">
          <Sparkles className="w-16 h-16 text-orange-500" />
        </div>
        <div className="absolute top-1/2 left-1/4">
          <Star className="w-12 h-12 text-red-500" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <MotionDiv
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Crown className="w-8 h-8 text-amber-600" />
            </MotionDiv>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              {title}
            </h2>
            <MotionDiv
              animate={{
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <Sparkles className="w-8 h-8 text-orange-600" />
            </MotionDiv>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </MotionDiv>

        {/* Special Offers Slider */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <Carousel
            items={specialOffers}
            renderItem={(product, index, current) => (
              <MotionDiv
                key={product.id}
                className={`flex-shrink-0 w-full sm:w-80 px-3 py-4 transform transition-all duration-500 ${
                  index === current
                    ? 'scale-105 z-10'
                    : 'scale-95 opacity-80'
                }`}
                whileHover={{
                  scale: index === current ? 1.05 : 1,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 overflow-hidden offers-special-glow">
                  {/* Special offer badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <MotionDiv
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 special-offer-badge"
                    >
                      <Sparkles className="w-4 h-4" />
                      عرض خاص
                    </MotionDiv>
                  </div>

                  {/* Discount percentage badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        -{product.discount}%
                      </div>
                    </div>
                  )}

                  <ProductCard
                    product={product}
                    className="border-0 shadow-none hover:shadow-none"
                    variant="special"
                  />

                  {/* Luxury overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  {/* Animated border */}
                  <MotionDiv
                    className="absolute inset-0 rounded-2xl border-2 border-transparent"
                    animate={{
                      borderColor: [
                        'rgba(245, 158, 11, 0)',
                        'rgba(245, 158, 11, 0.5)',
                        'rgba(245, 158, 11, 0)'
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </MotionDiv>
            )}
            visibleCount={3}
            centerMode={true}
            autoplay={true}
            interval={5000}
            pauseOnHover={true}
            showArrows={true}
            showDots={true}
            dotSize="medium"
            className="special-offers-carousel"
          />
        </MotionDiv>

        {/* Call to action */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            {locale === 'ar' ? 'عرض جميع العروض الفاخرة' : 'View All Luxury Offers'}
            <Sparkles className="w-5 h-5" />
          </motion.button>
        </MotionDiv>
      </div>
    </section>
  );
};

export default OffersSpecialSection;