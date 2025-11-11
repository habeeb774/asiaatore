// Centralized asset exports for better bundling and optimization
// Images
export { default as heroImage } from './images/hero-image.svg';
export { default as productFallback } from './images/product-fallback.svg';
export { default as siteLogoPng } from './images/site-logo.png';
export { default as siteLogoSvg } from './images/site-logo.svg';
export { default as siteLogoWebp } from './images/site-logo.webp';

// Badges
export { default as appStoreBadge } from './badges/app-store-badge.svg';
export { default as googlePlayBadge } from './badges/google-play-badge.svg';

// Legacy fallbacks (for gradual migration)
export const imageUrls = {
  heroImage: '/images/hero-image.svg',
  productFallback: '/images/product-fallback.svg',
  siteLogo: '/images/site-logo.png',
  categoryPlaceholder: '/images/category-placeholder.jpg',
  ogDefault: '/images/og-default.jpg',
  logo: '/images/logo.png',
  paymentMethods: '/img/payment_method.png'
};

export const badgeUrls = {
  appStore: '/assets/badges/app-store-badge.svg',
  googlePlay: '/assets/badges/google-play-badge.svg'
};

// Asset utilities
export const getOptimizedImageUrl = (src) => {
  if (!src) return imageUrls.productFallback;

  // If it's already an imported asset, return as is
  if (typeof src === 'string' && !src.startsWith('/')) {
    return src;
  }

  // For external URLs, return as is
  if (src.startsWith('http')) {
    return src;
  }

  // For local paths, you could add optimization parameters here
  return src;
};

export const preloadImage = (src) => {
  if (!src || typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

export const preloadCriticalImages = () => {
  // Preload critical images for better LCP
  const criticalImages = [
    imageUrls.siteLogo,
    imageUrls.productFallback,
    imageUrls.heroImage
  ];

  criticalImages.forEach(preloadImage);
};