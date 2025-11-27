import React from 'react';

// تحميل كسول للمكونات
export const lazyLoad = (importFunc, fallback = null) => {
  return React.lazy(() => 
    importFunc()
      .catch(error => {
        console.error('Failed to load component:', error);
        if (fallback) {
          return fallback();
        }
        throw error;
      })
  );
};

// تقسيم الكود حسب المسار
export const routeBasedSplitting = {
  // صفحات المشرف
  admin: {
    dashboard: () => import('../pages/admin/AdminDashboardModern'),
    products: () => import('../pages/admin/ProductsManagement'),
    orders: () => import('../pages/admin/OrdersManagement'),
    users: () => import('../pages/admin/UsersManagement'),
    settings: () => import('../pages/admin/Settings')
  },
  
  // الصفحات العامة
  public: {
    home: () => import('../pages/public/HomePageModern'),
    products: () => import('../pages/public/ProductList'),
    product: () => import('../pages/public/ProductDetails'),
    cart: () => import('../pages/public/Cart'),
    checkout: () => import('../pages/public/Checkout'),
    profile: () => import('../pages/public/UserProfile')
  },
  
  // المكونات المشتركة
  components: {
    productCard: () => import('../components/shared/ProductCard/ProductCardModern'),
    hero: () => import('../components/shared/Hero/HeroModern'),
    searchBar: () => import('../components/shared/SearchBar/SearchBarModern')
  }
};

// التحميل المسبق للمكونات الهامة
export const preloadComponent = (importFunc) => {
  const componentLoader = importFunc();
  componentLoader.catch(error => {
    console.warn('Preload failed:', error);
  });
  return componentLoader;
};

// التحميل المشروط للمكتبات
export const conditionalImports = {
  // تحميل مكتبة المخططات فقط عند الحاجة
  charts: () => import('recharts').then(module => module.default),
  
  // تحplotlib للخرائط فقط عند الحاجة
  maps: () => import('leaflet').then(module => module.default),
  
  // تحميل محرر النصوص فقط عند الحاجة
  editor: () => import('react-quill').then(module => module.default),
  
  // تحميل أدوات التحميل فقط عند الحاجة
  upload: () => import('react-dropzone').then(module => module.default),
  
  // تحميل مكتبة التقاويم فقط عند الحاجة
  calendar: () => import('react-datepicker').then(module => module.default)
};

// تحسين الصور
export const imageOptimization = {
  // تحويل الصور إلى WebP
  toWebP: (imageUrl, quality = 80) => {
    if (!imageUrl) return null;
    
    // إذا كانت الصورة من CDN يدعم WebP
    if (imageUrl.includes('cloudinary') || imageUrl.includes('imgix')) {
      return `${imageUrl}?q=${quality}&f=webp`;
    }
    
    return imageUrl;
  },
  
  // إنشاء صور مصغرة
  createThumbnail: (imageUrl, width = 300, height = 300) => {
    if (!imageUrl) return null;
    
    // إذا كان CDN يدعم تغيير الحجم
    if (imageUrl.includes('cloudinary')) {
      return `${imageUrl}?w=${width}&h=${height}&c=fill`;
    }
    
    if (imageUrl.includes('imgix')) {
      return `${imageUrl}?w=${width}&h=${height}&fit=crop`;
    }
    
    return imageUrl;
  },
  
  // تحميل صور متجاوب
  responsiveImage: (imageUrl, sizes = [400, 800, 1200]) => {
    if (!imageUrl) return [];
    
    return sizes.map(size => ({
      size,
      src: imageOptimization.createThumbnail(imageUrl, size, size),
      srcSet: `${imageOptimization.createThumbnail(imageUrl, size, size)} ${size}w`
    }));
  }
};

// تحسين الخطوط
export const fontOptimization = {
  // تحميل الخطوط بشكل استراتيجي
  preloadFonts: [
    {
      family: 'Cairo',
      weights: [300, 400, 600, 700],
      display: 'swap'
    },
    {
      family: 'Inter',
      weights: [300, 400, 500, 600, 700],
      display: 'swap'
    }
  ],
  
  // تحميل الخطوط عند الطلب
  loadFont: async (fontFamily, weight = 400) => {
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(`${weight}px ${fontFamily}`);
        return true;
      } catch (error) {
        console.error('Failed to load font:', error);
        return false;
      }
    }
    return false;
  }
};

// تحليل الأداء
export const performanceAnalysis = {
  // قياس وقت التحميل
  measureLoadTime: (componentName) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`${componentName} loaded in ${duration.toFixed(2)}ms`);
        
        // إرسال البيانات لخدمة التحليل (اختياري)
        if (window.gtag) {
          window.gtag('event', 'component_load_time', {
            component_name: componentName,
            load_time: duration
          });
        }
        
        return duration;
      }
    };
  },
  
  // مراقبة حجم الحزمة
  monitorBundleSize: () => {
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      
      return {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        
        // حساب نسبة الاستخدام
        memoryUsagePercentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      };
    }
    
    return null;
  },
  
  // تحليل Core Web Vitals
  analyzeWebVitals: () => {
    return new Promise((resolve) => {
      if ('web-vitals' in window) {
        const vitals = {};
        
        window.web-vitals.getCLS((metric) => {
          vitals.CLS = metric.value;
          checkComplete();
        });
        
        window.web-vitals.getFID((metric) => {
          vitals.FID = metric.value;
          checkComplete();
        });
        
        window.web-vitals.getLCP((metric) => {
          vitals.LCP = metric.value;
          checkComplete();
        });
        
        function checkComplete() {
          if (vitals.CLS !== undefined && vitals.FID !== undefined && vitals.LCP !== undefined) {
            resolve(vitals);
          }
        }
      } else {
        resolve(null);
      }
    });
  }
};

// التخزين المؤقت المتقدم
export const advancedCache = {
  // تخزين مؤقت مع انتهاء الصلاحية
  setWithExpiry: (key, value, ttl = 300000) => { // 5 دقائق افتراضي
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Failed to set cache:', error);
      return false;
    }
  },
  
  getWithExpiry: (key) => {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      
      if (!item) return null;
      
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  },
  
  // تخزين مؤقت للصور
  cacheImage: async (url, ttl = 86400000) => { // 24 ساعة
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        advancedCache.setWithExpiry(`image_${url}`, reader.result, ttl);
      };
      
      reader.readAsDataURL(blob);
      return true;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  },
  
  getCachedImage: (url) => {
    return advancedCache.getWithExpiry(`image_${url}`);
  }
};

// تحسين الشبكة
export const networkOptimization = {
  // طلبات متوازية
  parallelRequests: async (requests, concurrency = 3) => {
    const results = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map(req => req()));
      results.push(...batchResults);
    }
    
    return results;
  },
  
  // إعادة محاولة الطلب
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  },
  
  // ضغط البيانات
  compressData: (data) => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to compress data:', error);
      return data;
    }
  },
  
  decompressData: (compressedData) => {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Failed to decompress data:', error);
      return compressedData;
    }
  }
};

// Service Worker للـ PWA
export const serviceWorkerConfig = {
  // تسجيل Service Worker
  register: async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('Service Worker registered:', registration);
        
        // التحقق من التحديثات
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // هناك تحديث متاح
              if (confirm('New version available. Reload now?')) {
                window.location.reload();
              }
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    
    return null;
  },
  
  // إلغاء تسجيل Service Worker
  unregister: async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        console.log('Service Workers unregistered');
        return true;
      } catch (error) {
        console.error('Failed to unregister Service Worker:', error);
        return false;
      }
    }
    
    return false;
  }
};

export default {
  lazyLoad,
  routeBasedSplitting,
  preloadComponent,
  conditionalImports,
  imageOptimization,
  fontOptimization,
  performanceAnalysis,
  advancedCache,
  networkOptimization,
  serviceWorkerConfig
};
