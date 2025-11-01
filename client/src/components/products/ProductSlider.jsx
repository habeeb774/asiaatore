import React, { useState, useRef, useEffect, useMemo } from 'react';
import ProductCard from '../shared/ProductCard/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <section className="home-products section-padding text-black text-center">
      <div className="container-fixed">
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}

        <div className="relative overflow-hidden">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 p-2 rounded-full shadow hover:scale-110 disabled:opacity-40"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <div className={trackClass} style={trackStyle} ref={sliderRef}>
            {items.map((p) => (
              <div key={p.id} className={`flex-shrink-0 ${slideWidthClass} px-2`}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={current === maxIndex}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 p-2 rounded-full shadow hover:scale-110 disabled:opacity-40"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductSlider;
