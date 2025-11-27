import { useState, useEffect, useCallback } from 'react';
import { usePerformanceOptimization } from './usePerformanceOptimization';

/**
 * Custom hook for lazy loading images with optimization
 * 
 * @param {string} src - Image source URL
 * @param {Object} options - Optimization options
 * @returns {Object} - { imageSrc, isLoading, error }
 */
export const useLazyImage = (src, options = {}) => {
  const { optimizeImage } = usePerformanceOptimization();
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }
    
    const img = new Image();
    img.src = optimizeImage(src, options);
    
    img.onload = () => {
      setImageSrc(img.src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, options, optimizeImage]);
  
  return { imageSrc, isLoading, error };
};

export default useLazyImage;
