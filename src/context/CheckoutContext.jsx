import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';

export const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const { cartItems = [], clearCart } = useCart();
  const { addOrder } = useOrders?.() || {};
  const CURRENCY_CODE = 'SAR';
  const formatCurrency = (val) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: CURRENCY_CODE }).format(+val || 0);

  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  const [coupon, setCoupon] = useState(null); // { code, type:'percent'|'fixed', value }
  const applyCoupon = useCallback((code) => {
    const bank = {
      SAVE10: { code:'SAVE10', type:'percent', value:10 },
      FLAT25: { code:'FLAT25', type:'fixed', value:25 }
    };
    const found = bank[code.toUpperCase()];
    if (!found) return { success:false, reason:'invalid' };
    setCoupon(found);
    return { success:true, coupon:found };
  }, []);
  const clearCoupon = useCallback(()=> setCoupon(null), []);

  const totals = useMemo(() => {
    const rawItemsTotal = cartItems.reduce((s,i)=> s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0);
    const itemsTotal = round2(rawItemsTotal);
    const shipping = itemsTotal > 0 ? 25 : 0;
    const tax = round2(itemsTotal * 0.15);
    const discount = coupon
      ? round2(coupon.type === 'percent'
          ? itemsTotal * (coupon.value/100)
          : Math.min(coupon.value, itemsTotal))
      : 0;
    const grandTotal = round2(itemsTotal + shipping + tax - discount);
    return {
      itemsTotal, shipping, tax, discount, grandTotal,
      formatted: {
        itemsTotal: formatCurrency(itemsTotal),
        shipping: formatCurrency(shipping),
        tax: formatCurrency(tax),
        discount: formatCurrency(discount),
        grandTotal: formatCurrency(grandTotal)
      }
    };
  }, [cartItems, coupon]);

  const [lastOrder, setLastOrder] = useState(null);

  const placeOrder = useCallback(async (payload = {}) => {
    if (!cartItems.length) return { success:false, reason:'empty_cart' };
    const order = {
      id: Date.now().toString(),
      status: 'pending',
      currency: 'SAR',
      coupon: coupon ? { ...coupon } : null,
      items: cartItems.map(i => {
        const unit = i.price || i.salePrice || 0;
        const qty = i.quantity || 1;
        const subtotal = round2(unit * qty);
        return {
          id: i.id,
          title: i.title,
          price: unit,
          quantity: qty,
          subtotal,
          subtotalFormatted: formatCurrency(subtotal)
        };
      }),
      totals: { ...totals, currency:'SAR' },
      payment: payload.payment || { method:'cod' },
      shipping: payload.shipping || {},
      customer: payload.customer || {},
      notes: payload.notes || '',
      createdAt: new Date().toISOString()
    };
    try {
      if (addOrder) addOrder(order);
      else {
        const draft = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        draft.push(order);
        localStorage.setItem('pendingOrders', JSON.stringify(draft));
      }
      clearCart && clearCart();
      setLastOrder(order);
      return { success:true, order };
    } catch(e) {
      console.error('Failed to place order', e);
      return { success:false, error:e.message };
    }
  }, [cartItems, totals, addOrder, clearCart, coupon, formatCurrency]);

  const startPayment = (payMethod='card') => {
    switch (payMethod) {
      case 'applepay': return '/checkout/payment/applepay';
      case 'mada': return '/checkout/payment/mada';
      case 'card':
      default: return '/checkout/payment';
    }
  };

  const ctxValue = useMemo(()=>({
    cartItems,
    totals,
    currency: 'SAR',
    formatCurrency,
    placeOrder,
    startPayment,
    coupon,
    applyCoupon,
    clearCoupon,
    lastOrder
  }), [cartItems, totals, placeOrder, coupon, applyCoupon, clearCoupon, lastOrder]);

  return <CheckoutContext.Provider value={ctxValue}>{children}</CheckoutContext.Provider>;
}

export default CheckoutContext;
