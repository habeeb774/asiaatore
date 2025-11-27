import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  format = 'webp',
  quality = 75,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading with better performance
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px 0px', // Increased for better UX
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Generate responsive image sources
  const generateSrcSet = () => {
    if (!src) return '';
    
    const widths = [320, 640, 768, 1024, 1280, 1536];
    const baseUrl = src.includes('?') ? src.split('?')[0] : src;
    const params = new URLSearchParams(src.includes('?') ? src.split('?')[1] : '');
    
    return widths
      .map(w => {
        const url = new URL(baseUrl, window.location.origin);
        params.set('w', w);
        params.set('q', quality);
        params.set('f', format);
        url.search = params.toString();
        return `${url.toString()} ${w}w`;
      })
      .join(', ');
  };

  // Generate optimized placeholder
  const getPlaceholder = () => {
    if (placeholder === 'blur') {
      return `data:image/svg+xml,%3Csvg width='${width || 400}' height='${height || 300}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Crect width='100%25' height='100%25' fill='url(%23gradient)' opacity='0.4'/%3E%3Cdefs%3E%3ClinearGradient id='gradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23e5e7eb'/%3E%3Cstop offset='100%25' style='stop-color:%23f9fafb'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E`;
    }
    return '';
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={{ width: width || '100%', height: height || 'auto' }}
        {...props}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  const imageSrc = isInView ? src : getPlaceholder();
  const imageSrcSet = isInView ? generateSrcSet() : '';

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      {/* Optimized placeholder */}
      {!isLoaded && placeholder && (
        <div 
          className="absolute inset-0 bg-gray-100 skeleton"
          style={{ 
            backgroundImage: placeholder === 'blur' ? `url(${getPlaceholder()})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: width || '100%',
            height: height || 'auto'
          }}
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
