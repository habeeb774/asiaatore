import React, { useMemo } from 'react';
import ProductCard from '../components/shared/ProductCard';

/**
 * Custom hook for managing home page products data
 */
export const useHomeProducts = (products = []) => {
  const latestProducts = useMemo(
    () => products.slice(-6).reverse(),
    [products]
  );

  const discountedProducts = useMemo(
    () => products
      .filter((p) => p.oldPrice && p.oldPrice > p.price)
      .slice(0, 6),
    [products]
  );

  const featuredProducts = useMemo(
    () => products.slice(0, 12),
    [products]
  );

  return {
    latestProducts,
    discountedProducts,
    featuredProducts
  };
};

/**
 * Custom hook for managing motion variants
 */
export const useMotionVariants = () => {
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  }), []);

  return { containerVariants, itemVariants };
};

/**
 * Custom hook for managing product tiles rendering
 */
export const useProductTiles = (latestProducts, loading, Motion, itemVariants, t, locale) => {
  const wrapTile = useMemo(() => {
    return (child, key) => {
      const MotionDiv = Motion?.div;
      if (MotionDiv) {
        return (
          <MotionDiv key={key} variants={itemVariants}>
            {child}
          </MotionDiv>
        );
      }
      return <React.Fragment key={key}>{child}</React.Fragment>;
    };
  }, [Motion, itemVariants]);

  const productTiles = useMemo(() => {
    if (loading) {
      return Array.from({ length: 6 }, (_, index) =>
        wrapTile(
          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden product">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2" />
            </div>
          </div>,
          `loading-${index}`
        )
      );
    }

    if (latestProducts.length > 0) {
      return latestProducts.map((product) =>
        wrapTile(
          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-700 product">
            <ProductCard product={product} className="border-0 shadow-none hover:shadow-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
          </div>,
          `product-${product.id}`
        )
      );
    }

    return (
      <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">{t("noProductsFound")}</p>
          <p className="text-sm text-gray-400">{locale === 'ar' ? 'تحقق مرة أخرى لاحقاً' : 'Check back later'}</p>
        </div>
      </div>
    );
  }, [loading, latestProducts, wrapTile, t, locale]);

  return productTiles;
};