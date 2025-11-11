import React, { useMemo } from 'react';
import LazyImage from './LazyImage';

/**
 * Generic List Component - Replaces repetitive map/if patterns
 * Handles conditional rendering, filtering, and different display modes
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render each item
 * @param {Function} props.filterFn - Optional filter function
 * @param {Function} props.sortFn - Optional sort function
 * @param {string} props.emptyMessage - Message when no items
 * @param {React.Component} props.loadingComponent - Component to show when loading
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.className - Container className
 * @param {string} props.itemClassName - ClassName for each item container
 * @param {number} props.limit - Maximum items to show
 * @param {boolean} props.showIfEmpty - Whether to show container even when empty
 */
export const GenericList = ({
  items = [],
  renderItem,
  filterFn,
  sortFn,
  emptyMessage = 'No items found',
  loadingComponent: LoadingComponent,
  isLoading = false,
  className = '',
  itemClassName = '',
  limit,
  showIfEmpty = true,
  ...props
}) => {
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply filter
    if (filterFn) {
      result = result.filter(filterFn);
    }

    // Apply sort
    if (sortFn) {
      result = result.sort(sortFn);
    }

    // Apply limit
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [items, filterFn, sortFn, limit]);

  // Show loading state
  if (isLoading && LoadingComponent) {
    return <LoadingComponent {...props} />;
  }

  // Don't render if empty and showIfEmpty is false
  if (!showIfEmpty && processedItems.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={className} {...props}>
      {processedItems.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        processedItems.map((item, index) => (
          <div key={item.id || item.key || index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Generic Grid Component - Specialized for grid layouts
 */
export const GenericGrid = ({
  items = [],
  renderItem,
  columns = { default: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  ...props
}) => {
  const gridClasses = useMemo(() => {
    const classes = [`grid gap-${gap}`];

    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl']) classes.push(`2xl:grid-cols-${columns['2xl']}`);

    return classes.join(' ');
  }, [columns, gap]);

  return (
    <GenericList
      {...props}
      items={items}
      renderItem={renderItem}
      className={`${gridClasses} ${props.className || ''}`}
      itemClassName={props.itemClassName || ''}
    />
  );
};

/**
 * Generic Card Component - Reusable card pattern
 */
export const GenericCard = ({
  image,
  title,
  subtitle,
  price,
  originalPrice,
  discount,
  badge,
  onClick,
  className = '',
  imageClassName = 'aspect-square',
  contentClassName = 'p-4',
  ...props
}) => {
  const hasDiscount = originalPrice && price && originalPrice > price;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden rounded-t-lg ${imageClassName}`}>
        {image && (
          <LazyImage
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            blurPlaceholder
          />
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            {badge}
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && discount && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={contentClassName}>
        {/* Title */}
        {title && (
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
            {title}
          </h3>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Price Section */}
        <div className="flex items-center gap-2">
          {price && (
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {typeof price === 'number' ? `${price} SAR` : price}
            </span>
          )}

          {hasDiscount && (
            <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
              {originalPrice} SAR
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Conditional Wrapper Component - For conditional rendering patterns
 */
export const ConditionalWrapper = ({
  condition,
  wrapper,
  children
}) => {
  return condition ? wrapper(children) : children;
};

/**
 * Generic Section Component - Reusable section pattern with loading/error states
 */
export const GenericSection = ({
  title,
  children,
  isLoading,
  error,
  emptyMessage,
  className = '',
  headerClassName = '',
  contentClassName = '',
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  ...props
}) => {
  const renderContent = () => {
    if (isLoading) {
      return LoadingComponent ? <LoadingComponent /> : (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-48"></div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return ErrorComponent ? <ErrorComponent error={error} /> : (
        <div className="text-center py-8 text-red-500">
          <p>حدث خطأ في تحميل البيانات</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    if (React.Children.count(children) === 0 && emptyMessage) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      );
    }

    return children;
  };

  return (
    <section className={`py-8 ${className}`} {...props}>
      <div className="container mx-auto px-4">
        {title && (
          <div className={headerClassName}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {title}
            </h2>
          </div>
        )}

        <div className={contentClassName}>
          {renderContent()}
        </div>
      </div>
    </section>
  );
};

export default GenericList;