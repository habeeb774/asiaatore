import React from 'react';
import OptimizedImage from '../shared/OptimizedImage';

// A lightweight lazy image wrapper using OptimizedImage for better performance
// Props: src, alt, srcSet, sizes, className, wrapperClassName, style, imgStyle
// Options: priority (eager load), blurPlaceholder, retryOnError, maxRetries
export default function LazyImage({
  src,
  alt = '',
  srcSet,
  sizes,
  // If no sizes provided, use a smart responsive default suitable for grids
  defaultSizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
  className,
  wrapperClassName,
  style,
  imgStyle,
  priority = false,
  blurPlaceholder = true,
  // Event handlers
  onLoad,
  onError,
  ...rest
}) {
  const effectiveSizes = sizes || defaultSizes;

  return (
    <div className={wrapperClassName} style={style}>
      <OptimizedImage
        src={src}
        alt={alt}
        srcSet={srcSet}
        sizes={effectiveSizes}
        className={className}
        style={imgStyle}
        priority={priority}
        placeholder={blurPlaceholder ? 'blur' : 'empty'}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={onLoad}
        onError={onError}
        {...rest}
      />
    </div>
  );
}