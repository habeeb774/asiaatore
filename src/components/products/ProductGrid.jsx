import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, wide }) => {
  return (
    <div className={`products-grid ${wide ? 'wide' : ''}`}>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
};

export default ProductGrid;
