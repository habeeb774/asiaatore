import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api/client';

// Query keys
export const cartKeys = {
  all: ['cart'],
  items: () => [...cartKeys.all, 'items'],
  item: (id) => [...cartKeys.all, 'item', id],
};

// Get cart items
export const useCart = () => {
  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: async () => {
      const data = await api.cartList();
      const items = Array.isArray(data) ? data : (data.items || []);
      return items.map(item => ({
        id: item.productId || item.id,
        quantity: item.quantity || 1,
        price: item.price || item.salePrice || 0,
        ...item
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!localStorage.getItem('my_store_token'),
  });
};

// Add item to cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => {
      return await api.cartSet(productId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};

// Update item quantity
export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      return await api.cartSet(productId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};

// Remove item from cart
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId) => {
      return await api.cartRemoveItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};

// Clear cart
export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await api.cartClear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};

// Merge cart (used after login)
export const useMergeCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items) => {
      return await api.cartMerge(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};
