import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useCart as useCartQuery, useAddToCart, useUpdateCartQuantity, useRemoveFromCart, useClearCart, useMergeCart } from '../hooks/useCartQuery';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';

  // Server state from React Query
  const { data: serverCartItems = [], isLoading, error } = useCartQuery();
  const addToCartMutation = useAddToCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeFromCartMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();
  const mergeCartMutation = useMergeCart();

  // Client-only state
  const [cartItems, setCartItems] = useState([]);
  const [hasOldCartData, setHasOldCartData] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_cart');
      return raw && JSON.parse(raw).length > 0;
    } catch {
      return false;
    }
  });
  const hasMergedRef = useRef(false);

  // Sync server state to local state when it changes
  useEffect(() => {
    if (user && serverCartItems.length >= 0) {
      setCartItems(serverCartItems);
    }
  }, [serverCartItems, user]);

  useEffect(() => {
    try {
      localStorage.setItem('my_store_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const MAX_PER_ITEM = 10;
  // Helper: compute effective unit price using tierPrices in product (if any)
  function selectTierUnit(product, quantity) {
    const base = product?.price || 0;
    if (!Array.isArray(product?.tierPrices) || !product.tierPrices.length) return base;
    const sorted = [...product.tierPrices].sort((a,b)=> a.minQty - b.minQty);
    let chosen = base;
    for (const t of sorted) {
      if (quantity >= t.minQty) chosen = t.price; else break;
    }
    return chosen;
  }

  // Function to load old cart data when user chooses to
  const loadOldCartData = useCallback(() => {
    try {
      const raw = localStorage.getItem('my_store_cart');
      if (!raw) return;

      const list = JSON.parse(raw);
      // Deduplicate by id on hydrate (sum quantities, cap to sane max)
      const MAX = 10;
      const map = new Map();
      for (const it of Array.isArray(list) ? list : []) {
        const id = it?.id || it?.productId;
        if (!id) continue;
        const prev = map.get(id) || { ...it, id, quantity: 0 };
        const qty = Math.min(MAX, (prev.quantity || 0) + (parseInt(it.quantity || 1, 10) || 1));
        map.set(id, { ...prev, quantity: qty });
      }
      const oldItems = Array.from(map.values());
      setCartItems(oldItems);
      setHasOldCartData(false); // Mark as loaded

      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          type: 'success',
          title: locale === 'ar' ? 'تم تحميل السلة القديمة' : 'Old cart loaded',
          description: locale === 'ar' ? 'تم استعادة المنتجات من الجلسة السابقة' : 'Products restored from previous session'
        }
      }));
    } catch (error) {
      console.error('Failed to load old cart data:', error);
    }
  }, [locale]);

  // Function to clear old cart data on new session
  const clearOldCartData = useCallback(() => {
    try {
      localStorage.removeItem('my_store_cart');
      setCartItems([]);
      setHasOldCartData(false);
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          type: 'info',
          title: locale === 'ar' ? 'تم مسح السلة' : 'Cart cleared',
          description: locale === 'ar' ? 'تم مسح البيانات القديمة من السلة' : 'Old cart data cleared'
        }
      }));
    } catch (error) {
      console.error('Failed to clear old cart data:', error);
    }
  }, [locale]);

  const addToCart = useCallback((product, qty = 1) => {
    if (!product || !product.id) return { ok: false, reason: 'INVALID_PRODUCT' };

    // Require authentication to add to cart
    if (!user) {
      window.dispatchEvent(new CustomEvent('auth:required', { detail: { action: 'add_to_cart', productId: product.id } }));
      window.dispatchEvent(new CustomEvent('toast:show', { 
        detail: { 
          type: 'warn', 
          title: 'يرجى تسجيل الدخول', 
          description: 'يجب تسجيل الدخول لإضافة المنتجات إلى السلة' 
        } 
      }));
      return { ok: false, reason: 'AUTH_REQUIRED' };
    }

    // Optimistic update
    let updated;
    let finalDesiredQty = qty;
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        const currentQty = copy[idx].quantity || 1;
        const nextQty = Math.min(MAX_PER_ITEM, currentQty + qty);
        finalDesiredQty = nextQty;
        copy[idx].quantity = nextQty;
        copy[idx].price = selectTierUnit(product, nextQty);
        updated = { type: 'increment', quantity: nextQty };
        return copy;
      }
      const unit = selectTierUnit(product, qty);
      updated = { type: 'new', quantity: qty };
      return [...prev, { ...product, quantity: qty, price: unit }];
    });

    // UI events
    try {
      const detail = {
        productId: product.id,
        name: resolveLocalized(product?.name ?? product?.title, locale) || (typeof product?.name === 'string' ? product.name : product?.title) || 'منتج',
        image: (Array.isArray(product.images) && product.images[0]) || product.image || null,
        quantity: qty
      };
      window.dispatchEvent(new CustomEvent('cart:add', { detail }));
      window.dispatchEvent(new Event('cart:icon-bump'));
      const wasIncrement = updated?.type === 'increment';
      window.dispatchEvent(new CustomEvent('toast:show', { 
        detail: { 
          type: 'success', 
          title: wasIncrement ? 'تم تحديث الكمية' : 'تمت الإضافة إلى السلة', 
          description: detail.name 
        } 
      }));
    } catch {}

    // Server sync via React Query
    addToCartMutation.mutate(
      { productId: product.id, quantity: finalDesiredQty },
      {
        onError: (e) => {
          // Roll back optimistic update on stock errors
          if (e?.code === 'INSUFFICIENT_STOCK' || /INSUFFICIENT_STOCK/.test(e?.message||'')) {
            const available = Number(e?.data?.available ?? 0);
            setCartItems(prev => prev.map(i => {
              if (i.id !== product.id) return i;
              const next = Math.min(i.quantity || 0, available);
              const unit = selectTierUnit(product, next);
              return { ...i, quantity: next, price: unit };
            }));
            try {
              window.dispatchEvent(new CustomEvent('toast:show', { 
                detail: { 
                  type: 'error', 
                  title: 'الكمية غير متاحة', 
                  description: `المتوفر الآن: ${available}` 
                } 
              }));
            } catch {}
          }
        }
      }
    );

    return { ok: true, ...updated };
  }, [user, locale, addToCartMutation]);

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    if (user) {
      removeFromCartMutation.mutate(productId);
    }
  };

  const updateQuantity = (productId, quantity) => {
    let prevQty = 0;
    setCartItems(prev => prev.map(i => {
      if (i.id !== productId) return i;
      prevQty = i.quantity || 0;
      const unit = selectTierUnit(i, quantity);
      return { ...i, quantity, price: unit };
    }));

    // Server sync via React Query
    if (user) {
      updateQuantityMutation.mutate(
        { productId, quantity },
        {
          onError: (e) => {
            // Roll back on stock errors
            if (e?.code === 'INSUFFICIENT_STOCK' || /INSUFFICIENT_STOCK/.test(e?.message||'')) {
              const available = Number(e?.data?.available ?? 0);
              setCartItems(prev => prev.map(i => {
                if (i.id !== productId) return i;
                const next = Math.min(available, prevQty);
                const unit = selectTierUnit(i, next);
                return { ...i, quantity: next, price: unit };
              }));
              try { 
                window.dispatchEvent(new CustomEvent('toast:show', { 
                  detail: { 
                    type: 'error', 
                    title: 'الكمية غير متاحة', 
                    description: `المتوفر الآن: ${available}` 
                  } 
                })); 
              } catch {}
            }
          }
        }
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) { 
      clearCartMutation.mutate();
    }
  };

  // On user login: merge local items with server cart
  useEffect(() => {
    const syncCart = async () => {
      let hasToken = false;
      try { hasToken = !!localStorage.getItem('my_store_token') } catch {}
      if (!user || !hasToken || hasMergedRef.current) return;

      // Add a small delay to prevent overwhelming the API on login
      setTimeout(async () => {
        if (cartItems.length) {
          // Merge local cart with server cart
          mergeCartMutation.mutate(
            cartItems.map(m => ({ productId: m.id, quantity: m.quantity })),
            {
              onSuccess: (resp) => {
                const skipped = Array.isArray(resp?.skipped) ? resp.skipped : [];
                if (skipped.length) {
                  const msg = (locale === 'ar')
                    ? `تعذر إضافة ${skipped.length} عنصر بسبب نفاد المخزون`
                    : `${skipped.length} items were skipped (out of stock)`;
                  try { 
                    window.dispatchEvent(new CustomEvent('toast:show', { 
                      detail: { 
                        type: 'warn', 
                        title: 'نفاد المخزون', 
                        description: msg 
                      } 
                    })); 
                  } catch {}
                }
              }
            }
          );
        }
        hasMergedRef.current = true;
      }, 500);
    };
    syncCart();
  }, [user, cartItems, mergeCartMutation, locale]);

  const cartTotal = cartItems.reduce((sum, i) => sum + (Number(i.price || i.salePrice || 0) * Number(i.quantity || 1)), 0);
  const value = { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    clearOldCartData,
    loadOldCartData,
    hasOldCartData,
    cartTotal, 
    maxPerItem: MAX_PER_ITEM, 
    loading: isLoading, 
    error 
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
export default CartContext;
