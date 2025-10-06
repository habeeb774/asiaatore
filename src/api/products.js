import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from './http';

// Create a stable query key for lists based on filters/sort/pagination
const listKey = (params) => ['products', { ...params }];

async function fetchProducts({ queryKey, signal }) {
  const [, params] = queryKey;
  // Server route mounted under /api/products
  return get('/products', params, { signal });
}

export function useProducts(params) {
  // Keep previous data during pagination for instant UI
  return useQuery({
    queryKey: listKey(params),
    queryFn: fetchProducts,
    placeholderData: (prev) => prev,
  });
}

// Individual product
const productKey = (id) => ['product', id];

async function fetchProduct({ queryKey, signal }) {
  const [, id] = queryKey;
  return get(`/products/${id}`, undefined, { signal });
}

export function useProduct(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: productKey(id),
    queryFn: fetchProduct,
    enabled: !!id && enabled,
  });
}

// Helpers: prefetch by id and "next page"
export function useProductPrefetch() {
  const qc = useQueryClient();
  return (id) =>
    qc.prefetchQuery({
      queryKey: productKey(id),
      queryFn: fetchProduct,
      staleTime: 60_000,
    });
}

export function useNextPagePrefetch(params, hasNext) {
  const qc = useQueryClient();
  return () => {
    if (!hasNext) return;
    const nextParams = { ...params, page: (Number(params?.page) || 1) + 1 };
    return qc.prefetchQuery({
      queryKey: listKey(nextParams),
      queryFn: fetchProducts,
      staleTime: 60_000,
    });
  };
}

// Invalidate all product lists (e.g., after admin updates)
export function invalidateProducts(qc) {
  return qc.invalidateQueries({ queryKey: ['products'] });
}
