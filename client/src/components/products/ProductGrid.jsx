import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, wide, showImageBadge = true, showPriceBadge = true }) => {
  // Use Tailwind grid utility to enforce two-column layout on small+ screens.
  // Mobile: 1 column, Small (sm) and up: 2 columns. Keep the existing .products-grid class
  // so legacy CSS rules still apply for card styling.
  return (
    <div className={`products-grid ${wide ? 'wide' : ''} grid grid-cols-1 sm:grid-cols-2 gap-6`}>
      {products.map((p, idx) => (
        <ProductCard
          key={p.id}
          product={p}
          showImageBadge={showImageBadge}
          showPriceBadge={showPriceBadge}
          priority={idx < 2} /* mark first two items as priority for LCP */
        />
      ))}
    </div>
  );
};

export default ProductGrid;
