import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
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
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success', title: 'تمت الإضافة إلى السلة', description: detail.name } }));
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
      if (!user) return; // not logged in
      if (hasMergedRef.current) return;
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
    };
    syncCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  const value = { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, maxPerItem: MAX_PER_ITEM, loading, error };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
export default CartContext;