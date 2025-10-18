import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, wide, showImageBadge = true, showPriceBadge = true }) => {
  return (
    <div className={`products-grid ${wide ? 'wide' : ''}`}>
      {products.map(p => <ProductCard key={p.id} product={p} showImageBadge={showImageBadge} showPriceBadge={showPriceBadge} />)}
    </div>
  );
};

export default ProductGrid;
