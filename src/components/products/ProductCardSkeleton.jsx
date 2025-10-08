import React from 'react';
import { Skeleton } from '../ui/skeleton.jsx';

const ProductCardSkeleton = () => {
  return (
    <div className="product-card p-4">
      <Skeleton className="h-40 w-full rounded-lg mb-3" />
      <Skeleton className="h-3 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-9 w-full rounded" />
    </div>
  );
};

export default ProductCardSkeleton;
