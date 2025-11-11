import React from 'react';
import ProductCard from '../shared/ProductCard';

/**
 * FeaturedProductsSection Component - Displays featured products
 */
const FeaturedProductsSection = ({ products = [], Motion, containerVariants, itemVariants, t, locale }) => {
  if (!products.length) return null;

  const MotionDiv = Motion?.div || 'div';

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('featuredProducts') || 'منتجات مميزة'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {locale === 'ar' ? 'اكتشف منتجاتنا الأكثر شعبية ومبيعاً' : 'Discover our most popular and best-selling products'}
          </p>
        </div>

        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {products.map((product) => (
            <MotionDiv key={product.id} variants={itemVariants}>
              <div className="group relative bg-white dark:bg-gray-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600 overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-700">
                <ProductCard product={product} className="border-0 shadow-none hover:shadow-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              </div>
            </MotionDiv>
          ))}
        </MotionDiv>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;