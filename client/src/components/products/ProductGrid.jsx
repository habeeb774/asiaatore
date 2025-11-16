import React from 'react';
import ProductCard from '../shared/ProductCard';

const ProductGrid = ({
  products,
  wide,
  showImageBadge = true,
  showPriceBadge = true,
  layout = 'default'
}) => {
  const layoutClass = layout === 'catalog' ? 'catalog-layout' : '';
  const responsiveCols = layout === 'catalog'
    ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-2';

  return (
    <div className={`products-grid ${wide ? 'wide' : ''} ${layoutClass} ${responsiveCols}`.trim()}>
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
