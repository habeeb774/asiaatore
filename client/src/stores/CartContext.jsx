import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api/client';
import { useLanguage } from './LanguageContext';
import { resolveLocalized } from '../utils/locale';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  const [cartItems, setCartItems] = useState([]);
  const [hasOldCartData, setHasOldCartData] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_cart');
      return raw && JSON.parse(raw).length > 0;
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasMergedRef = useRef(false);
  // Timers map for debouncing server sync per productId
  const syncTimersRef = useRef(new Map());

  // Cleanup any pending sync timers on unmount
  useEffect(() => () => {
    try {
      syncTimersRef.current.forEach(t => clearTimeout(t));
      syncTimersRef.current.clear();
    } catch {}
  }, []);

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

  // Check if cart has old data from previous sessions
  // Now handled by useState above

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
      setError('AUTH_REQUIRED');
      try {
        window.dispatchEvent(new CustomEvent('auth:required', { detail: { action: 'add_to_cart', productId: product.id } }));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'warn', title: 'يرجى تسجيل الدخول', description: 'يجب تسجيل الدخول لإضافة المنتجات إلى السلة' } }));
      } catch {}
      return { ok: false, reason: 'AUTH_REQUIRED' };
    }
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
        // recompute unit price if tier pricing applies
        copy[idx].price = selectTierUnit(product, nextQty);
        updated = { type: 'increment', quantity: nextQty };
        return copy;
      }
      const unit = selectTierUnit(product, qty);
      updated = { type: 'new', quantity: qty };
      return [...prev, { ...product, quantity: qty, price: unit }];
    });
    try {
      const detail = {
        productId: product.id,
        name: resolveLocalized(product?.name ?? product?.title, locale) || (typeof product?.name === 'string' ? product.name : product?.title) || 'منتج',
        image: (Array.isArray(product.images) && product.images[0]) || product.image || null,
        quantity: qty
      };
      window.dispatchEvent(new CustomEvent('cart:add', { detail }));
      // Trigger a subtle cart icon bump animation for visual feedback
      window.dispatchEvent(new Event('cart:icon-bump'));
      const wasIncrement = updated?.type === 'increment';
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success', title: wasIncrement ? 'تم تحديث الكمية' : 'تمت الإضافة إلى السلة', description: detail.name } }));
    } catch {}
    // Server sync — ensure we send the intended qty (not product.quantity field)
    (async () => {
      try {
        // Send absolute desired quantity, not delta
        await api.cartSet(product.id, finalDesiredQty);
      } catch (e) {
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
            window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'error', title: 'الكمية غير متاحة', description: `المتوفر الآن: ${available}` } }));
          } catch {}
        } else {
          setError(e.message);
        }
      }
    })();
    return { ok: true, ...updated };
  }, [user, locale]);

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    if (user) {
      (async () => {
        try { await api.cartRemoveItem(productId); } catch (e) { setError(e.message); }
      })();
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
    // Debounce server sync per-product to avoid flooding API on rapid clicks/holds.
    if (user) {
      try {
        const timers = syncTimersRef.current;
        if (timers.has(productId)) clearTimeout(timers.get(productId));
        const timer = setTimeout(async () => {
          try {
            await api.cartSet(productId, quantity);
          } catch (e) {
            if (e?.code === 'INSUFFICIENT_STOCK' || /INSUFFICIENT_STOCK/.test(e?.message||'')) {
              const available = Number(e?.data?.available ?? 0);
              setCartItems(prev => prev.map(i => {
                if (i.id !== productId) return i;
                const next = Math.min(available, prevQty);
                const unit = selectTierUnit(i, next);
                return { ...i, quantity: next, price: unit };
              }));
              try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'error', title: 'الكمية غير متاحة', description: `المتوفر الآن: ${available}` } })); } catch {}
            } else {
              setError(e.message);
            }
          } finally {
            try { timers.delete(productId); } catch {}
          }
        }, 300);
        timers.set(productId, timer);
      } catch (err) { /* ignore timer errors */ }
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) { (async () => { try { await api.cartClear(); } catch (e) { setError(e.message); } })(); }
  };

  // On user login: fetch server cart & merge local items (first time per session)
  useEffect(() => {
    const syncCart = async () => {
      // Only call server if we have an access token present
      let hasToken = false
      try { hasToken = !!localStorage.getItem('my_store_token') } catch {}
      if (!user || !hasToken) return; // not logged in or no token
      if (hasMergedRef.current) return;

      // Add a small delay to prevent overwhelming the API on login
      setTimeout(async () => {
        setLoading(true); setError(null);
        try {
          const serverData = await api.cartList(); // expect items with product reference or simplified
          const serverItems = Array.isArray(serverData) ? serverData : (serverData.items || []);
          // Build map for merging
          const map = new Map();
          serverItems.forEach(it => {
            map.set(it.productId || it.id, {
              id: it.productId || it.id,
              quantity: it.quantity || 1,
              price: it.price || it.salePrice || 0,
              ...it
            });
          });
          // Merge local unsynced
          cartItems.forEach(l => {
            if (!map.has(l.id)) {
              map.set(l.id, l);
            } else {
              // take max quantity
              const existing = map.get(l.id);
              existing.quantity = Math.max(existing.quantity || 1, l.quantity || 1);
              map.set(l.id, existing);
            }
          });
          const merged = Array.from(map.values());
          setCartItems(merged);
          if (cartItems.length) {
            // push merge to server, then refetch authoritative cart
            try {
              const resp = await api.cartMerge(merged.map(m => ({ productId: m.id, quantity: m.quantity })));
              const skipped = Array.isArray(resp?.skipped) ? resp.skipped : [];
              if (skipped.length) {
                const msg = (locale === 'ar')
                  ? `تعذر إضافة ${skipped.length} عنصر بسبب نفاد المخزون`
                  : `${skipped.length} items were skipped (out of stock)`;
                try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'warn', title: 'نفاد المخزون', description: msg } })); } catch {}
              }
            } catch {}
            try {
              const fresh = await api.cartList();
              const freshItems = Array.isArray(fresh) ? fresh : (fresh.items || []);
              setCartItems(freshItems.map(it => ({
                id: it.productId || it.id,
                quantity: it.quantity || 1,
                price: it.price || it.salePrice || 0,
                ...it
              })));
            } catch {}
          }
          hasMergedRef.current = true;
        } catch (e) {
          setError(e.message);
        } finally { setLoading(false); }
      }, 500); // 500ms delay for cart sync
    };
    syncCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    loading, 
    error 
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
export default CartContext;