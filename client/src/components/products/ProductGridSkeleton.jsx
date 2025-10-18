import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton.jsx';

// Heuristic: derive count from viewport to minimize layout shift if not provided
function deriveCount(wide) {
  if (typeof window === 'undefined') return 12;
  const w = window.innerWidth || 1200;
  // approximate columns for our grid breakpoints
  const cols = w >= 1280 ? (wide ? 5 : 4) : w >= 1024 ? (wide ? 4 : 3) : w >= 640 ? 2 : 1;
  const rows = 3; // show ~3 rows as placeholder
  return cols * rows;
}

const ProductGridSkeleton = ({ count, wide = false }) => {
  const effective = Number.isFinite(count) ? count : deriveCount(wide);
  return (
    <div className={`products-grid ${wide ? 'wide' : ''}`} role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: effective }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
