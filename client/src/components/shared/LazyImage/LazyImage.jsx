import React, { useState, useEffect, useRef, useCallback } from 'react';

// Enhanced LazyImage component with advanced caching and optimization
const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 75,
  sizes = '100vw',
  onLoad,
  onError,
  style = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate optimized image URLs
  const generateImageUrls = useCallback((baseSrc) => {
    if (!baseSrc) return { original: '', webp: '', avif: '' };

    const isExternal = baseSrc.startsWith('http');
    const baseUrl = isExternal ? baseSrc : `${window.location.origin}${baseSrc}`;

    return {
      original: baseUrl,
      webp: baseUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      avif: baseUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif')
    };
  }, []);

  const imageUrls = generateImageUrls(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate blur placeholder
  const getBlurPlaceholder = useCallback(() => {
    if (blurDataURL) return blurDataURL;

    // Simple blur placeholder based on image dimensions
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="10"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#f3f4f6" filter="url(#blur)"/>
      </svg>
    `)}`;
  }, [blurDataURL]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback((baseUrl, format = 'original') => {
    if (!baseUrl) return '';

    const widths = [320, 640, 768, 1024, 1280, 1920];
    const srcSet = widths.map(width => {
      const url = format === 'webp' ? imageUrls.webp : format === 'avif' ? imageUrls.avif : baseUrl;
      return `${url}?w=${width}&q=${quality} ${width}w`;
    }).join(', ');

    return srcSet;
  }, [quality, imageUrls]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={style}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <img
          src={getBlurPlaceholder()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'skeleton' && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 animate-pulse" />
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* AVIF format for modern browsers */}
          <source
            srcSet={generateSrcSet(imageUrls.avif, 'avif')}
            sizes={sizes}
            type="image/avif"
          />
          {/* WebP format for better compression */}
          <source
            srcSet={generateSrcSet(imageUrls.webp, 'webp')}
            sizes={sizes}
            type="image/webp"
          />
          {/* Fallback to original format */}
          <img
            src={imageUrls.original}
            srcSet={generateSrcSet(imageUrls.original, 'original')}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}

      {/* Loading indicator */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default React.memo(LazyImage);