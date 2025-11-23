import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api/client';

// Query keys
export const wishlistKeys = {
  all: ['wishlist'],
  items: () => [...wishlistKeys.all, 'items'],
  item: (id) => [...wishlistKeys.all, 'item', id],
};

// Get wishlist items
export const useWishlist = () => {
  return useQuery({
    queryKey: wishlistKeys.items(),
    queryFn: async () => {
      const data = await api.wishlistList();
      const items = Array.isArray(data) ? data : (data.items || []);
      return items.map(item => ({
        ...item,
        id: item.productId || item.id
      }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!localStorage.getItem('my_store_token'),
  });
};

// Add item to wishlist
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId) => {
      return await api.wishlistAdd(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.items() });
    },
  });
};

// Remove item from wishlist
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId) => {
      return await api.wishlistRemove(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.items() });
    },
  });
};

// Clear wishlist
export const useClearWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productIds) => {
      // Fire & forget sequentially to keep API simple
      for (const id of productIds) {
        await api.wishlistRemove(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.items() });
    },
  });
};
