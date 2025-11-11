import React, { Suspense, lazy, useState, useEffect } from 'react';

/**
 * Lazy Wrapper for heavy components with performance monitoring
 * Provides lazy loading, error boundaries, and loading states
 */

// Lazy load components with error handling
export const lazyLoad = (importFunc, fallbackName = 'Component') => {
  const LazyComponent = lazy(() =>
    importFunc().catch(error => {
      console.error(`Failed to load ${fallbackName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="text-center py-8 text-red-500">
            <p>فشل في تحميل {fallbackName}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
            >
              إعادة المحاولة
            </button>
          </div>
        )
      };
    })
  );

  return LazyComponent;
};

/**
 * LazyWrapper Component - Wraps components for lazy loading
 */
export const LazyWrapper = ({
  children,
  fallback,
  errorFallback,
  onError,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError && onError) {
      onError();
    }
  }, [hasError, onError]);

  if (hasError) {
    return errorFallback || (
      <div className="text-center py-8 text-red-500">
        <p>حدث خطأ في تحميل المكون</p>
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      <Suspense fallback={fallback || <div className="animate-pulse h-32 bg-gray-200 rounded"></div>}>
        {children}
      </Suspense>
    </div>
  );
};

/**
 * LazySection Component - Specialized for page sections
 */
export const LazySection = ({
  component: Component,
  importFunc,
  title,
  isVisible = true,
  rootMargin = '200px',
  ...props
}) => {
  const [isInView, setIsInView] = useState(false);
  const [LazyComponent, setLazyComponent] = useState(null);

  useEffect(() => {
    if (!isVisible || !importFunc) return;

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLazyComponent(() => lazyLoad(importFunc, title));
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    // Create a placeholder element to observe
    const placeholder = document.createElement('div');
    placeholder.style.height = '1px';
    document.body.appendChild(placeholder);

    observer.observe(placeholder);

    return () => {
      observer.disconnect();
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    };
  }, [isVisible, importFunc, title, rootMargin]);

  if (!isVisible) return null;

  if (!LazyComponent) {
    // Loading placeholder
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <LazyWrapper
      fallback={
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-48"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LazyComponent {...props} />
    </LazyWrapper>
  );
};

/**
 * Performance Monitor HOC - Tracks component performance
 */
export const withPerformanceMonitor = (ComponentName) => (WrappedComponent) => {
  return React.memo((props) => {
    useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        // Log slow renders (> 16ms for 60fps)
        if (renderTime > 16) {
          console.warn(`${ComponentName} slow render: ${renderTime.toFixed(2)}ms`);
        }
      };
    }, [props]);

    return <WrappedComponent {...props} />;
  });
};

/**
 * Bundle Splitter - Creates lazy-loaded component bundles
 */
export const createLazyBundle = (components) => {
  const lazyComponents = {};

  Object.entries(components).forEach(([name, importFunc]) => {
    lazyComponents[name] = lazyLoad(importFunc, name);
  });

  return lazyComponents;
};

export default LazyWrapper;