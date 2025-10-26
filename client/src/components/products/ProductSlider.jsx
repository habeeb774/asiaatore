import React, { useState, useRef, useEffect } from 'react';
import ProductCard from '../shared/ProductCard/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const discountedSlider = ({ products = [], title }) => {
  const [current, setCurrent] = useState(0);
  const sliderRef = useRef(null);

  const visibleCount = 3; // show 3 products at a time

  const maxIndex = Math.max(0, products.length - visibleCount);

  const goPrev = () => setCurrent(c => Math.max(0, c - 1));
  const goNext = () => setCurrent(c => Math.min(maxIndex, c + 1));

  useEffect(() => {
    const handleResize = () => {};
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="home-products section-padding text-black text-center">
      <div className="container-fixed">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>

        <div className="relative overflow-hidden">
          <button onClick={goPrev} disabled={current === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 p-2 rounded-full shadow hover:scale-110">
            <ChevronLeft size={24} />
          </button>

          <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${current * (100 / visibleCount)}%)` }} ref={sliderRef}>
            {products.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[calc(100%/3)] px-2">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button onClick={goNext} disabled={current === maxIndex} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 p-2 rounded-full shadow hover:scale-110">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default discountedSlider;
