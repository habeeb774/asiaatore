import React from 'react';
import { Skeleton } from '../ui/skeleton.jsx';

// Visual placeholder for Product Detail page: gallery + info
const ProductDetailSkeleton = () => {
  return (
    <div className="product-detail grid grid-cols-1 md:grid-cols-2 gap-6" aria-hidden>
      {/* Left: Image/Gallery */}
      <div>
        <Skeleton className="w-full rounded-xl" style={{ aspectRatio: '1/1' }} />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full rounded-lg" style={{ aspectRatio: '1/1' }} />
          ))}
        </div>
      </div>
      {/* Right: Title/Price/Actions */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-end gap-3 mt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
