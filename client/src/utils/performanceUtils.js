// Performance optimization utilities

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  const criticalResources = [
    '/fonts/cairo-arabic-400.woff2',
    '/fonts/cairo-arabic-600.woff2',
    '/assets/site-logo.png'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.includes('.woff2') ? 'font' : 'image';
    link.type = resource.includes('.woff2') ? 'font/woff2' : 'image/png';
    if (resource.includes('.woff2')) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

// Intersection Observer for lazy loading
export const createLazyLoader = (callback, options = {}) => {
  if (typeof window === 'undefined') return null;

  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });

  return observer;
};

// Debounced resize observer for performance monitoring
export const createResizeObserver = (callback, delay = 100) => {
  if (typeof window === 'undefined') return null;

  let timeoutId;
  const observer = new ResizeObserver((entries) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(entries);
    }, delay);
  });

  return observer;
};

// Memory usage monitoring (development only)
export const monitorMemory = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  if ('memory' in performance) {
    const memory = performance.memory;
    console.log('Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
};

// Critical CSS inliner for faster first paint
export const inlineCriticalCSS = (css) => {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.insertBefore(style, document.head.firstChild);
};

// Resource hints for better performance
export const addResourceHints = () => {
  if (typeof document === 'undefined') return;

  // DNS prefetch for external domains
  const domains = [
    'https://api.stripe.com',
    'https://www.paypal.com',
    'https://fonts.googleapis.com'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect for critical domains
  const criticalDomains = [
    'https://api.stripe.com',
    'https://www.paypal.com'
  ];

  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Performance mark and measure utilities
export const markPerformance = (name) => {
  if (typeof performance === 'undefined') return;
  performance.mark(name);
};

export const measurePerformance = (name, startMark) => {
  if (typeof performance === 'undefined') return;
  
  try {
    performance.measure(name, startMark);
    const measure = performance.getEntriesByName(name, 'measure')[0];
    console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    performance.clearMarks(startMark);
    performance.clearMeasures(name);
  } catch (error) {
    console.warn('Performance measurement failed:', error);
  }
};

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
        console.log(`Resource loaded: ${entry.name} - ${Math.round(entry.transferSize / 1024)} KB`);
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.warn('Performance observer not supported');
  }
};
