import React, { useEffect, useRef, useState } from 'react';

// A lightweight lazy image with IntersectionObserver + optional skeleton
// Props: src, alt, srcSet, sizes, className (applied to <img>), wrapperClassName, style (wrapper), imgStyle
// Options: rootMargin (default '200px'), skeleton (default true), priority (eager load)
export default function LazyImage({
  src,
  alt = '',
  srcSet,
  sizes,
  className,
  wrapperClassName,
  style,
  imgStyle,
  rootMargin = '200px',
  skeleton = true,
  priority = false,
  onLoad,
  ...rest
}) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(priority || false);
  const [loaded, setLoaded] = useState(false);

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
        <img
          src={src}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={(e) => {
            setLoaded(true);
            onLoad && onLoad(e);
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
