import React, { useState, useEffect } from 'react';
import { motion } from '../../lib/framerLazy.js';
import { useLanguage } from '../../stores/LanguageContext';
import ProductCard from '../shared/ProductCard';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/client';
import { Clock, TrendingUp, Star } from 'lucide-react';

const NewArrivalsSection = ({
  title,
  subtitle,
  maxItems = 12,
  className = '',
  showFilters = true
}) => {
  const { locale } = useLanguage();
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  // Fetch new products from API
  const {
    data: productsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['products', 'new-arrivals', { limit: maxItems, sort: sortBy, filter: filterBy }],
    queryFn: async () => {
      const params = {
        limit: maxItems,
        sort: sortBy === 'newest' ? '-createdAt' : sortBy === 'price-low' ? 'price' : '-price',
        ...(filterBy !== 'all' && { category: filterBy })
      };

      const response = await api.listProducts(params);
      return Array.isArray(response) ? response : response.products || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
  });

  const products = productsData || [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const sortOptions = [
    { value: 'newest', label: locale === 'ar' ? 'الأحدث' : 'Newest' },
    { value: 'price-low', label: locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' },
    { value: 'price-high', label: locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' }
  ];

  const filterOptions = [
    { value: 'all', label: locale === 'ar' ? 'جميع الفئات' : 'All Categories' },
    { value: 'electronics', label: locale === 'ar' ? 'إلكترونيات' : 'Electronics' },
    { value: 'clothing', label: locale === 'ar' ? 'ملابس' : 'Clothing' },
    { value: 'home', label: locale === 'ar' ? 'المنزل' : 'Home' }
  ];

  return (
    <section className={`new-arrivals-section py-16 bg-gradient-to-b from-gray-50 to-white ${className}`}>
      <div className="container-fixed px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            <span>{locale === 'ar' ? 'جديد' : 'New'}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title || (locale === 'ar' ? 'المنتجات الجديدة' : 'New Arrivals')}
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || (locale === 'ar'
              ? 'اكتشف أحدث المنتجات المضافة إلى متجرنا'
              : 'Discover the latest products added to our store'
            )}
          </p>
        </motion.div>

        {/* Filters and Sorting */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter By */}
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gray-500" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locale === 'ar' ? 'حدث خطأ في تحميل المنتجات' : 'Error loading products'}
            </h3>
            <p className="text-gray-500">
              {error?.message || (locale === 'ar' ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later')}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isError && products.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="group"
              >
                <div className="relative">
                  {/* New Badge */}
                  <div className="absolute top-3 right-3 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    {locale === 'ar' ? 'جديد' : 'New'}
                  </div>

                  <ProductCard
                    product={product}
                    variant="default"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locale === 'ar' ? 'لا توجد منتجات جديدة' : 'No new products'}
            </h3>
            <p className="text-gray-500">
              {locale === 'ar' ? 'تحقق مرة أخرى لاحقاً للعثور على منتجات جديدة' : 'Check back later for new products'}
            </p>
          </div>
        )}

        {/* View More Button */}
        {products.length >= maxItems && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-colors duration-300">
              {locale === 'ar' ? 'عرض المزيد' : 'View More'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default NewArrivalsSection;