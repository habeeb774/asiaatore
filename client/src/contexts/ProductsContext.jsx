import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import api from '../services/api/client';
import { useQuery } from '@tanstack/react-query';

const ProductsContext = createContext(null);

// Fallback placeholder while fetching real products
const fallbackProducts = Array.from({ length: 6 }).map((_, i) => {
  const id = (i + 1).toString();
  return {
    id,
    slug: `product-${id}`,
    name: { ar: `منتج ${id}`, en: `Product ${id}` },
    short: { ar: 'وصف مؤقت', en: 'Temp description' },
    price: 25 + i * 2,
    oldPrice: i % 2 === 0 ? 30 + i * 2 : null,
    image: `/images/product-fallback.svg`,
    imageVariants: {
      thumb: `/images/product-fallback.svg`,
      medium: `/images/product-fallback.svg`,
      large: `/images/product-fallback.svg`
    },
    rating: (i % 5) + 1,
    stock: 5 + i
  };
});

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use React Query for products with proper caching
  const {
    data: remoteProducts,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const data = await api.listProducts();
      if (Array.isArray(data)) {
        // Normalize shape for UI components expecting: name(string), originalPrice, images[]
        const normalized = data.map(p => {
          const nameObj = p.name || { ar: p.nameAr, en: p.nameEn };
          const nameAr = nameObj?.ar || p.nameAr || '';
          const nameEn = nameObj?.en || p.nameEn || '';
          const variants = p.imageVariants || null;
          const gallery = Array.isArray(p.gallery) ? p.gallery : [];
          // choose display image preference: main thumb -> first gallery thumb -> main medium -> original -> gallery first -> first images[]
          let displayImage = p.image;
          if (variants) {
            displayImage = variants.thumb || variants.medium || variants.original || p.image;
          }
          if (!displayImage && gallery.length) {
            const g0 = gallery[0];
            if (g0?.variants) displayImage = g0.variants.thumb || g0.variants.medium || g0.variants.original || g0.url;
            else displayImage = g0.url;
          }
          return {
            ...p,
            name: nameAr, // legacy simple name (Arabic default)
            nameAr,
            nameEn,
            originalPrice: p.oldPrice || p.originalPrice || null,
            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            gallery,
            displayImage,
          };
        });
        return normalized;
      }
      return [];
    },
    enabled: true, // Always enabled since products are core to the app
    staleTime: 5 * 60 * 1000, // 5 minutes - products don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Sync query results into our local state when available
  useEffect(() => {
    if (Array.isArray(remoteProducts)) {
      setProducts(remoteProducts);
      setError(null);
    }
  }, [remoteProducts]);

  // Handle query errors
  useEffect(() => {
    if (isError) {
      setError(queryError?.message || 'Failed to load products');
    }
  }, [isError, queryError]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const value = useMemo(() => ({
    products,
    loading,
    error,
    list: () => products,
    getProductById: (id) => products.find(p => p.id === id),
    getProductBySlug: (slug) => products.find(p => p.slug === slug)
  }), [products, loading, error]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};export const useProducts = () => useContext(ProductsContext);

export default ProductsContext;
