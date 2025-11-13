import React from 'react';
import ProductCard from '../shared/ProductCard';
import Carousel from '../ui/Carousel';

const FeaturedProductsSlider = ({ products = [], title, autoplay = true, interval = 4000 }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="featured-products-slider my-8" aria-roledescription="carousel">
      <div className="container-fixed">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-800 drop-shadow-sm">{title}</h2>
        </div>

        {/* Responsive grid for large screens */}
        <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
          {products.map((p) => (
            <div key={p.id} className="px-2">
              <ProductCard product={p} variant="featured" />
            </div>
          ))}
        </div>

        {/* Carousel for small screens */}
        <div className="lg:hidden">
          <Carousel
            items={products}
            renderItem={(p, i, current) => (
              <div className={`flex-shrink-0 w-full px-2 py-4 transform transition-transform duration-500 ${i === current ? 'scale-105' : 'scale-90'} drop-shadow-md`}>
                <ProductCard product={p} variant="featured" />
              </div>
            )}
            visibleCount={3}
            centerMode={true}
            autoplay={autoplay}
            interval={interval}
            pauseOnHover={true}
            showArrows={true}
            showDots={true}
            dotSize="small"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSlider;