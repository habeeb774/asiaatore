import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { useToast } from './ToastContext';

type CartItem = { id: string; quantity: number; price?: number; image?: string; name?: any };
type CartValue = {
  cartItems: CartItem[];
  addToCart: (product: any, qty?: number) => { ok: boolean; reason?: string };
  updateQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
};

const Ctx = createContext<CartValue | null>(null);

const MAX_PER_ITEM = 10;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const mergedRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      if (mergedRef.current) return;
      try {
        const server = await api.cartList();
        const items = Array.isArray(server) ? server : (server.items || []);
        setCartItems(items.map((it: any) => ({ id: it.productId || it.id, quantity: it.quantity || 1, price: it.price || it.salePrice || 0, ...it })));
        mergedRef.current = true;
      } catch {}
    })();
  }, []);

  const addToCart = useCallback((product: any, qty = 1) => {
    if (!product?.id) return { ok: false, reason: 'INVALID_PRODUCT' };
    let desired = qty;
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        const current = copy[idx].quantity || 0;
        const next = Math.min(MAX_PER_ITEM, current + qty);
        desired = next;
        copy[idx].quantity = next;
        return copy;
      }
      return [...prev, { id: product.id, quantity: qty, price: product.price, name: product.name, image: product.image }];
    });
    (async () => {
      try {
        await api.cartSet(String(product.id), desired);
        toast.show({ type: 'success', title: 'تمت الإضافة إلى السلة' });
      } catch (e: any) {
        if (e?.code === 'INSUFFICIENT_STOCK') {
          const available = Number(e?.data?.available ?? 0);
          setCartItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: Math.min(i.quantity, available) } : i));
          toast.show({ type: 'error', title: 'الكمية غير متاحة', description: `المتوفر الآن: ${available}` });
        }
      }
    })();
    return { ok: true };
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    let prevQty = 0;
    setCartItems(prev => prev.map(i => {
      if (i.id !== productId) return i;
      prevQty = i.quantity;
      return { ...i, quantity: qty };
    }));
    (async () => {
      try {
        await api.cartSet(String(productId), qty);
      } catch (e: any) {
        if (e?.code === 'INSUFFICIENT_STOCK') {
          const available = Number(e?.data?.available ?? 0);
          setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity: Math.min(prevQty, available) } : i));
          toast.show({ type: 'error', title: 'الكمية غير متاحة', description: `المتوفر الآن: ${available}` });
        }
      }
    })();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    (async () => { try { await api.cartSet(String(productId), 0); } catch {} })();
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    (async () => { try { await api.cartClear(); } catch {} })();
  }, []);

  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  return <Ctx.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal }}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx)!;
