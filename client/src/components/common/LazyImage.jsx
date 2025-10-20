import React, { useEffect, useRef, useState } from 'react';

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
  onLoad,
  onError,
  ...rest
}) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(priority || false);
  const [loaded, setLoaded] = useState(false);
  // Effective sizes: explicit sizes win; otherwise fallback to a sensible default for product grids
  const effectiveSizes = sizes || defaultSizes;

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
      {skeleton && !loaded && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
            backgroundSize: '400% 100%',
            animation: 'lazyimg-shimmer 1.2s ease-in-out infinite',
            borderRadius: 8,
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
              onLoad={(e) => {
                setLoaded(true);
                onLoad && onLoad(e);
              }}
              onError={(e) => {
                try {
                  if (onError) return onError(e);
                  const target = e.currentTarget;
                  // prevent infinite loop
                  if (!target.dataset.fallbackApplied) {
                    target.dataset.fallbackApplied = '1';
                    target.src = '/images/hero-image.svg';
                  }
                } catch {}
              }}
              className={className}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 220ms ease',
                opacity: loaded ? 1 : 0,
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
            onLoad={(e) => {
              setLoaded(true);
              onLoad && onLoad(e);
            }}
            onError={(e) => {
              try {
                if (onError) return onError(e);
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = '1';
                  target.src = '/images/hero-image.svg';
                }
              } catch {}
            }}
            className={className}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 220ms ease',
              opacity: loaded ? 1 : 0,
              ...imgStyle,
            }}
            {...rest}
          />
        )
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
