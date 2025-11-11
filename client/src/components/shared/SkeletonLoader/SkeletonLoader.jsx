import React from 'react';

// Enhanced Skeleton Loader Components
export const Skeleton = ({
  className = '',
  variant = 'rectangle',
  animation = 'pulse',
  ...props
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700';

  const variantClasses = {
    rectangle: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    avatar: 'rounded-full w-10 h-10',
    button: 'rounded-md h-10',
    card: 'rounded-lg p-4 space-y-3',
    product: 'rounded-lg space-y-3'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    shimmer: 'animate-shimmer'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      {...props}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${className}`}>
    {/* Image skeleton */}
    <Skeleton className="aspect-square w-full" />

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" variant="text" />
      <Skeleton className="h-3 w-1/2" variant="text" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-16" variant="text" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </div>
);

// Category Chip Skeleton
export const CategoryChipSkeleton = ({ className = '' }) => (
  <div className={`flex items-center gap-2 p-3 rounded-full border border-gray-200 dark:border-gray-700 ${className}`}>
    <Skeleton className="w-5 h-5 rounded" />
    <Skeleton className="h-4 w-16" variant="text" />
  </div>
);

// Hero Section Skeleton
export const HeroSkeleton = ({ className = '' }) => (
  <div className={`relative bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 ${className}`}>
    <div className="container-custom py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <Skeleton className="h-12 w-3/4 mx-auto" variant="text" />
        <Skeleton className="h-6 w-1/2 mx-auto" variant="text" />
        <Skeleton className="h-12 w-40 mx-auto rounded-lg" />
      </div>
    </div>
  </div>
);

// Banner Skeleton
export const BannerSkeleton = ({ className = '' }) => (
  <div className={`bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-48" variant="text" />
        <Skeleton className="h-4 w-64" variant="text" />
        <Skeleton className="h-10 w-32 rounded-lg mt-4" />
      </div>
      <Skeleton className="w-24 h-24 rounded-full ml-6" />
    </div>
  </div>
);

// Grid Skeleton for products
export const ProductGridSkeleton = ({
  count = 6,
  className = '',
  columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
}) => (
  <div className={`grid ${columns} gap-4 md:gap-6 ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Slider Skeleton
export const SliderSkeleton = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <Skeleton className="h-6 w-48" variant="text" />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex-shrink-0 w-64">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  </div>
);

// Features Skeleton
export const FeaturesSkeleton = ({ count = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="text-center space-y-3">
        <Skeleton className="w-12 h-12 rounded-full mx-auto" />
        <Skeleton className="h-5 w-24 mx-auto" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-3/4 mx-auto" variant="text" />
      </div>
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} className="h-4 flex-1" variant="text" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 py-2">
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton
            key={colIndex}
            className={`h-4 ${colIndex === 0 ? 'w-32' : 'flex-1'}`}
            variant="text"
          />
        ))}
      </div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = ({ fields = 4, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
    ))}
    <Skeleton className="h-10 w-32 rounded" />
  </div>
);

// Profile Skeleton
export const ProfileSkeleton = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-32" variant="text" />
        <Skeleton className="h-4 w-48" variant="text" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
    </div>
  </div>
);

// SkeletonLoader component that handles different types
export const SkeletonLoader = ({ type, count = 1, className = '', ...props }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'searchResult':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 rtl:space-x-reverse">
                <Skeleton className="w-12 h-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'button':
        return <Skeleton className={`h-10 w-24 rounded ${className}`} {...props} />;
      case 'text':
        return <Skeleton className={`h-4 w-full ${className}`} {...props} />;
      case 'card':
        return (
          <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        );
      case 'tableHeader':
        return (
          <div className={`grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        );
      case 'tableRow':
        return (
          <div className={`grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        );
      case 'chart':
        return <Skeleton className={`h-64 w-full rounded ${className}`} {...props} />;
      case 'table':
        return <Skeleton className={`h-96 w-full rounded ${className}`} {...props} />;
      case 'stats':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        );
      case 'review':
        return (
          <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 ${className}`}>
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        );
      case 'metric':
        return (
          <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        );
      case 'search-result':
        return (
          <div className={`flex items-center space-x-3 rtl:space-x-reverse p-3 ${className}`}>
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        );
      case 'table-row':
        return (
          <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Skeleton className="w-10 h-10 rounded" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        );
      default:
        return <Skeleton className={className} {...props} />;
    }
  };

  return renderSkeleton();
};

export default Skeleton;