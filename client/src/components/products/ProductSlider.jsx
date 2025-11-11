import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from '../../lib/framerLazy';
import { useLanguage } from '../../stores/LanguageContext';
import { resolveLocalized } from '../../utils/locale';
import LazyImage from '../common/LazyImage';

const ProductCardSkeleton = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

const SimpleProductCard = ({ product, index = 0 }) => {
  const { locale } = useLanguage();

  const name = useMemo(() =>
    resolveLocalized(product?.name ?? product?.title, locale) ||
    (typeof product?.name === 'string' ? product.name : product?.title) || '',
    [product, locale]
  );

  const price = product?.price || 0;
  const oldPrice = product?.oldPrice || product?.originalPrice;
  const imageSrc = product?.image || product?.imageVariants?.large || product?.imageVariants?.medium || '/images/product-fallback.svg';

  return (
    <motion.div
      className="product"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        y: -10,
        scale: 1.05,
        rotateY: 5,
        transition: { type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="image-container"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
          whileHover={{
            scale: 1.15,
            rotate: 3,
            filter: "brightness(1.1)",
            transition: { type: "spring", stiffness: 300 }
          }}
        >
          <LazyImage
            src={imageSrc}
            alt={name}
            className="w-full h-48 object-cover"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="info"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
      >
        <motion.div
          className="name"
          whileHover={{ scale: 1.02, color: "#ff8716" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {name}
        </motion.div>
        <motion.div
          className="price"
          whileHover={{ scale: 1.01 }}
        >
          <motion.span
            className="current-price"
            whileHover={{ scale: 1.05, color: "#22c55e" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {price} {locale === 'ar' ? 'ر.س' : 'SAR'}
          </motion.span>
          {oldPrice && oldPrice > price && (
            <motion.span
              className="old-price"
              whileHover={{ scale: 0.95, opacity: 0.7 }}
            >
              {oldPrice} {locale === 'ar' ? 'ر.س' : 'SAR'}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const ProductSlider = ({ products = [], title, limit = 12 }) => {
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sliderRef = useRef(null);

  // Keep the list small to avoid heavy first paint
  const items = useMemo(() => (products || []).slice(0, Math.max(1, limit)), [products, limit]);

  // Responsive counts (1 on small, 2 on md, 3 on lg+)
  useEffect(() => {
    const updateVisible = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // Avoid transition on very first mount to reduce jank
  useEffect(() => { const id = setTimeout(() => setMounted(true), 100); return () => clearTimeout(id); }, []);

  const maxIndex = Math.max(0, items.length - visibleCount);

  const goPrev = () => setCurrent(c => Math.max(0, c - 1));
  const goNext = () => setCurrent(c => Math.min(maxIndex, c + 1));

  const trackStyle = {
    transform: `translateX(-${current * (100 / visibleCount)}%)`
  };
  const trackClass = `flex ${reducedMotion || !mounted ? '' : 'transition-transform duration-500'}`;
  const slideWidthClass = visibleCount === 1 ? 'w-full' : visibleCount === 2 ? 'w-1/2' : 'w-1/3';

  return (
    <motion.div
      className="slide_product"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {title && (
        <motion.div
          className="top_slide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.h2
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {title}
          </motion.h2>
        </motion.div>
      )}

      <motion.div
        className={trackClass}
        style={trackStyle}
        ref={sliderRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {items.map((p, index) => (
          <motion.div
            key={p.id}
            className={`flex-shrink-0 ${slideWidthClass} px-2`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.8 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
          >
            <SimpleProductCard product={p} index={index} />
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        onClick={goPrev}
        disabled={current === 0}
        className="btn_Swip swiper-button-prev"
        aria-label="Previous"
        whileHover={{
          scale: 1.1,
          backgroundColor: "#ff8716",
          boxShadow: "0 5px 15px rgba(255, 135, 22, 0.3)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2, type: "spring", stiffness: 400 }}
      >
        ‹
      </motion.button>

      <motion.button
        onClick={goNext}
        disabled={current === maxIndex}
        className="btn_Swip swiper-button-next"
        aria-label="Next"
        whileHover={{
          scale: 1.1,
          backgroundColor: "#ff8716",
          boxShadow: "0 5px 15px rgba(255, 135, 22, 0.3)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2, type: "spring", stiffness: 400 }}
      >
        ›
      </motion.button>
    </motion.div>
  );
};

export default ProductSlider;
export { ProductCardSkeleton };
