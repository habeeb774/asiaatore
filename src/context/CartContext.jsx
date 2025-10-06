import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
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
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        const currentQty = copy[idx].quantity || 1;
        const nextQty = Math.min(MAX_PER_ITEM, currentQty + qty);
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
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success', title: 'تمت الإضافة إلى السلة', description: detail.name } }));
    } catch {}
    // Server sync — ensure we send the intended qty (not product.quantity field)
    (async () => {
      try { await api.cartSet(product.id, qty); } catch (e) { setError(e.message); }
    })();
    return { ok: true, ...updated };
  }, [user]);

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    if (user) {
      (async () => {
        try { await api.cartSet(productId, 0); } catch (e) { setError(e.message); }
      })();
    }
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems(prev => prev.map(i => {
      if (i.id !== productId) return i;
      const unit = selectTierUnit(i, quantity);
      return { ...i, quantity, price: unit };
    }));
    if (user) {
      (async () => { try { await api.cartSet(productId, quantity); } catch (e) { setError(e.message); } })();
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
          // push merge to server
            try { await api.cartMerge(merged.map(m => ({ productId: m.id, quantity: m.quantity }))); } catch {}
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