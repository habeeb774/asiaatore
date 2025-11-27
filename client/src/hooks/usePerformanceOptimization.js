import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * usePerformanceOptimization - Hook محسّن للأداء
 * 
 * الميزات:
 * - تحسين الصور
 * - التخزين المؤقت
 * - تحميل كسول
 * - مراقبة الأداء
 * - تحسين الذاكرة
 */
export const usePerformanceOptimization = () => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });
  
  const startTime = useRef(Date.now());
  const renderTime = useRef(0);
  
  // مراقبة وقت التحميل
  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    setMetrics(prev => ({ ...prev, loadTime }));
  }, []);
  
  // مراقبة وقت العرض
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          renderTime.current = entry.duration;
          setMetrics(prev => ({ ...prev, renderTime: entry.duration }));
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
  
  // مراقبة استخدام الذاكرة
  useEffect(() => {
    if ('memory' in performance) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: performance.memory.usedJSHeapSize
        }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  // تحسين الصور
  const optimizeImage = useCallback((src, options = {}) => {
    if (!src) return src;
    
    const {
      width,
      height,
      quality = 80,
      format = 'auto'
    } = options;
    
    const params = new URLSearchParams();
    
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    params.append('q', quality);
    
    if (format !== 'auto') {
      params.append('f', format);
    }
    
    return `${src}?${params.toString()}`;
  }, []);
  
  // التخزين المؤقت المتقدم
  const cache = {
    set: useCallback((key, value, ttl = 300000) => {
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
    }, []),
    
    get: useCallback((key) => {
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
    }, []),
    
    remove: useCallback((key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Failed to remove cache:', error);
        return false;
      }
    }, []),
    
    clear: useCallback(() => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Failed to clear cache:', error);
        return false;
      }
    }, [])
  };
  
  // تحليل الأداء
  const performance = {
    measure: useCallback((name, fn) => {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();
      
      console.log(`${name} took ${endTime - startTime}ms`);
      return result;
    }, []),
    
    measureAsync: useCallback(async (name, fn) => {
      const startTime = performance.now();
      const result = await fn();
      const endTime = performance.now();
      
      console.log(`${name} took ${endTime - startTime}ms`);
      return result;
    }, []),
    
    getMemoryUsage: useCallback(() => {
      if ('memory' in performance) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    }, [])
  };
  
  return {
    metrics,
    optimizeImage,
    cache,
    performance,
    // Export hooks for use in components
    useLazyImage: () => import('./useLazyImage').then(mod => mod.default),
    useVirtualList: () => import('./useVirtualList').then(mod => mod.default),
    useSmoothScroll: () => import('./useSmoothScroll').then(mod => mod.default),
    useAnimation: () => import('./useAnimation').then(mod => mod.default)
  };
};

export default usePerformanceOptimization;
