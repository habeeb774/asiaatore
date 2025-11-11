import React, { useEffect, useRef, useState, useCallback } from 'react';
import { productFallback } from '../../assets';

// A lightweight lazy image with IntersectionObserver + optional skeleton
// Props: src, alt, srcSet, sizes, className (applied to <img>), wrapperClassName, style (wrapper), imgStyle
// Options: rootMargin (default '200px'), skeleton (default true), priority (eager load)
export default function LazyImage({
  src,
  alt = '',
  srcSet,
  sizes,
  // If no sizes provided, use a smart responsive default suitable for grids
  defaultSizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
  // Optional modern formats
  avifSrcSet,
  webpSrcSet,
  // Or provide full custom sources [{ type, srcSet, sizes }]
  sources,
  className,
  wrapperClassName,
  style,
  imgStyle,
  rootMargin = '200px',
  skeleton = true,
  priority = false,
  // New: blur placeholder for smoother loading
  blurPlaceholder = true,
  // New: retry on error
  retryOnError = true,
  maxRetries = 2,
  // Event handlers
  onLoad,
  onError,
  ...rest
}) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(priority || false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState(src);
  
  const effectiveSizes = sizes || defaultSizes;
  // Memoized error handler
  const handleError = useCallback((e) => {
    if (onError) return onError(e);

    const target = e.currentTarget;
    if (!target.dataset.fallbackApplied) {
      if (retryOnError && retryCount < maxRetries) {
        // Retry loading the image
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          target.src = imageSrc;
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // Apply fallback
      target.dataset.fallbackApplied = '1';
      setError(true);
      setImageSrc(productFallback);
      target.src = productFallback;
    }
  }, [onError, retryOnError, maxRetries, retryCount, imageSrc]);

  // Memoized load handler
  const handleLoad = useCallback((e) => {
    setLoaded(true);
    setError(false);
    onLoad && onLoad(e);
  }, [onLoad]);

  useEffect(() => {
    if (priority || inView) return; // skip IO if priority or already in view
    if (!containerRef.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold: 0.05 }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, [priority, inView, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={wrapperClassName}
      style={{ position: 'relative', display: 'block', ...style }}
    >
      {skeleton && !loaded && !error && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: blurPlaceholder
              ? 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)'
              : '#f3f4f6',
            backgroundSize: blurPlaceholder ? '400% 100%' : '100% 100%',
            animation: blurPlaceholder ? 'lazyimg-shimmer 1.2s ease-in-out infinite' : 'none',
            borderRadius: 8,
            filter: blurPlaceholder ? 'blur(10px)' : 'none',
            transform: blurPlaceholder ? 'scale(1.1)' : 'none',
          }}
        />
      )}
      {inView && (
        sources || avifSrcSet || webpSrcSet ? (
          <picture>
            {/* Custom sources first for full control */}
            {Array.isArray(sources) && sources.map((s, i) => (
              <source key={i} type={s.type} srcSet={s.srcSet} sizes={s.sizes} />
            ))}
            {/* Convenience modern formats */}
            {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={effectiveSizes} /> : null}
            {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={effectiveSizes} /> : null}
            <img
              src={src}
              alt={alt}
              srcSet={srcSet}
              sizes={effectiveSizes}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              className={className}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 220ms ease, filter 220ms ease',
                opacity: loaded ? 1 : 0,
                filter: loaded ? 'none' : blurPlaceholder ? 'blur(10px)' : 'none',
                transform: loaded ? 'scale(1)' : blurPlaceholder ? 'scale(1.1)' : 'scale(1)',
                ...imgStyle,
              }}
              {...rest}
            />
          </picture>
        ) : (
          <img
            src={src}
            alt={alt}
            srcSet={srcSet}
            sizes={effectiveSizes}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={className}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 220ms ease, filter 220ms ease',
              opacity: loaded ? 1 : 0,
              filter: loaded ? 'none' : blurPlaceholder ? 'blur(10px)' : 'none',
              transform: loaded ? 'scale(1)' : blurPlaceholder ? 'scale(1.1)' : 'scale(1)',
              ...imgStyle,
            }}
            {...rest}
          />
        )
      )}

      {/* Error state indicator */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            color: '#6b7280',
            fontSize: '12px',
            borderRadius: 8,
          }}
        >
          Image unavailable
        </div>
      )}

      <style>{`
        @keyframes lazyimg-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}
