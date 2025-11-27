// Advanced bundle optimization utilities

// Dynamic import utilities for code splitting
export const dynamicImport = (importFn) => {
  return React.lazy(() => {
    return Promise.all([
      importFn(),
      new Promise(resolve => setTimeout(resolve, 100)) // Minimum loading time for better UX
    ]).then(([moduleExports]) => moduleExports);
  });
};

// Preload chunks for better performance
export const preloadChunk = (chunkName) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `/assets/${chunkName}.js`;
  document.head.appendChild(link);
};

// Intersection Observer for lazy loading components
export const createComponentLoader = (componentImport, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    fallback = null,
  } = options;

  return (props) => {
    const [Component, setComponent] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const elementRef = React.useRef();

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        async (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            try {
              setIsLoading(true);
              const module = await componentImport();
              setComponent(() => module.default);
              setError(null);
            } catch (err) {
              setError(err);
              console.error('Component loading failed:', err);
            } finally {
              setIsLoading(false);
            }
            observer.unobserve(entry.target);
          }
        },
        { rootMargin, threshold }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    }, [componentImport, rootMargin, threshold]);

    if (error && fallback) {
      return React.cloneElement(fallback, props);
    }

    if (isLoading && !Component) {
      return React.cloneElement(fallback || React.createElement('div'), props);
    }

    if (!Component) {
      return React.createElement('div', props);
    }

    return React.createElement(Component, props);
  };
};

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const bundles = entries.filter(entry => 
      entry.initiatorType === 'script' && entry.name.includes('.js')
    );

    bundles.forEach(bundle => {
      const size = bundle.transferSize || 0;
      const sizeKB = Math.round(size / 1024);
      
      if (sizeKB > 100) {
        console.warn(`📦 Large bundle detected: ${bundle.name.split('/').pop()} - ${sizeKB}KB`);
      } else {
        console.log(`📦 Bundle loaded: ${bundle.name.split('/').pop()} - ${sizeKB}KB`);
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.warn('Bundle monitoring not supported');
  }
};

// Critical resource preloader
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  const criticalChunks = [
    'vendor.react',
    'vendor.router', 
    'vendor.tanstack',
    'index'
  ];

  criticalChunks.forEach(chunk => {
    preloadChunk(chunk);
  });

  // Preload critical CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'preload';
  cssLink.href = '/assets/index.css';
  cssLink.as = 'style';
  cssLink.onload = function() {
    this.rel = 'stylesheet';
  };
  document.head.appendChild(cssLink);
};

// Route-based chunk preloading
export const preloadRouteChunks = (routePath) => {
  if (typeof window === 'undefined') return;

  const routeChunkMap = {
    '/admin': ['chunk.admin.dashboard', 'chunk.admin.products'],
    '/admin/products': ['chunk.admin.products'],
    '/admin/orders': ['chunk.admin.orders'],
    '/admin/users': ['chunk.admin.users'],
    '/admin/reports': ['chunk.admin.analytics'],
    '/seller': ['chunk.seller'],
    '/delivery': ['chunk.delivery'],
    '/checkout': ['chunk.pages.checkout'],
    '/products': ['chunk.pages.products'],
    '/orders': ['chunk.pages.orders'],
  };

  const chunks = routeChunkMap[routePath];
  if (chunks) {
    chunks.forEach(chunk => preloadChunk(chunk));
  }
};

// Memory optimization utilities
export const optimizeMemory = () => {
  if (typeof window === 'undefined') return;

  // Clear unused caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('old-') || cacheName.includes('temp-')) {
          caches.delete(cacheName);
        }
      });
    });
  }

  // Force garbage collection if available
  if (window.gc && process.env.NODE_ENV === 'development') {
    window.gc();
  }
};

// Performance metrics collector
export const collectPerformanceMetrics = () => {
  if (typeof window === 'undefined') return;

  const metrics = {
    // Navigation timing
    navigationStart: performance.timing.navigationStart,
    loadEventEnd: performance.timing.loadEventEnd,
    domContentLoaded: performance.timing.domContentLoadedEventEnd,
    
    // Resource timing
    resourceCount: performance.getEntriesByType('resource').length,
    totalResourceSize: performance.getEntriesByType('resource')
      .reduce((total, entry) => total + (entry.transferSize || 0), 0),
    
    // Memory usage (if available)
    memory: performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    } : null,
  };

  const loadTime = metrics.loadEventEnd - metrics.navigationStart;
  const domTime = metrics.domContentLoaded - metrics.navigationStart;

  console.log('📊 Performance Metrics:', {
    loadTime: `${Math.round(loadTime)}ms`,
    domTime: `${Math.round(domTime)}ms`,
    resourceCount: metrics.resourceCount,
    totalSize: `${Math.round(metrics.totalResourceSize / 1024)}KB`,
    memory: metrics.memory ? `${Math.round(metrics.memory.used / 1024 / 1024)}MB` : 'N/A',
  });

  return metrics;
};

// Bundle optimization suggestions
export const analyzeBundleOptimization = () => {
  if (typeof window === 'undefined') return;

  const suggestions = [];
  const resources = performance.getEntriesByType('resource');
  
  // Check for large bundles
  const largeBundles = resources.filter(r => 
    r.name.includes('.js') && r.transferSize > 100 * 1024
  );
  
  if (largeBundles.length > 0) {
    suggestions.push({
      type: 'warning',
      message: `${largeBundles.length} large bundles detected (>100KB)`,
      action: 'Consider further code splitting'
    });
  }

  // Check for unused CSS
  const cssFiles = resources.filter(r => r.name.includes('.css'));
  if (cssFiles.length > 3) {
    suggestions.push({
      type: 'info',
      message: `${cssFiles.length} CSS files loaded`,
      action: 'Consider CSS purging and critical CSS extraction'
    });
  }

  // Check for font optimization
  const fontFiles = resources.filter(r => r.name.includes('.woff') || r.name.includes('.ttf'));
  if (fontFiles.length > 5) {
    suggestions.push({
      type: 'info',
      message: `${fontFiles.length} font files loaded`,
      action: 'Consider font subsetting and variable fonts'
    });
  }

  if (suggestions.length > 0) {
    console.group('🔍 Bundle Optimization Suggestions');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. [${suggestion.type.toUpperCase()}] ${suggestion.message}`);
      console.log(`   Action: ${suggestion.action}`);
    });
    console.groupEnd();
  }

  return suggestions;
};
