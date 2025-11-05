import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';
import { Link } from 'react-router-dom';
import Button, { ButtonLink } from '../components/ui/Button';
import { motion, AnimatePresence } from '../lib/framerLazy';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import LazyImage from '../components/common/LazyImage';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart, maxPerItem, addToCart } = useCart() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  // Safe localization wrapper for names/titles/alt
  const safe = (v) => String(resolveLocalized(v, locale) || '');
  const items = cartItems || [];
  const [couponCode, setCouponCode] = useState('');
  const [undo, setUndo] = useState(null); // { item, timeoutId }
  const holdTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), [locale]);
  const formatCurrency = (value) => currencyFormatter.format(Math.max(0, Number(value) || 0));
  const totalValue = typeof cartTotal === 'number'
    ? cartTotal
    : items.reduce((sum, item) => sum + (Number(item.price ?? item.salePrice ?? 0) * (item.quantity || 1)), 0);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - totalValue);
  const progressToFreeShipping = Math.min(100, Math.round((totalValue / freeShippingThreshold) * 100));
  const handleClearCart = () => {
    if (!clearCart) return;
    const message = locale === 'ar' ? 'هل تريد إفراغ السلة؟' : 'Do you want to empty the cart?';
    if (typeof window === 'undefined' || window.confirm(message)) {
      clearCart();
    }
  };

  // Cleanup any timers on unmount
  useEffect(() => () => { clearInterval(repeatTimerRef.current); clearTimeout(holdTimerRef.current); }, []);

  // Prefetch checkout chunk when cart has items (idle-time) to speed up navigation
  useEffect(() => {
    if (!items || items.length === 0) return;
    try {
      if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(() => { import('/src/pages/CheckoutPage.jsx'); }, { timeout: 1500 });
      } else {
  setTimeout(() => { import('/src/pages/CheckoutPage.jsx'); }, 1500);
      }
    } catch {}
  }, [items.length]);

  // Long-press handlers for quantity buttons
  const startRepeat = (fn) => {
    // Light haptic if supported
    try { navigator.vibrate?.(10); } catch {}
    clearInterval(repeatTimerRef.current);
    repeatTimerRef.current = setInterval(() => { try { fn(); } catch {} }, 110);
  };
  const onHoldStart = (fn) => {
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => startRepeat(fn), 260);
  };
  const onHoldEnd = () => {
    clearTimeout(holdTimerRef.current);
    clearInterval(repeatTimerRef.current);
  };

  const applyCoupon = () => {
    // Backend route not implemented; present a friendly message
    try {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'info', title: locale==='ar'?'قريباً':'Coming soon', description: locale==='ar'?'تطبيق الكوبونات سيكون متاحاً قريباً':'Coupon application will be available soon' } }));
    } catch {}
  };

  const onRemove = (item) => {
    removeFromCart?.(item.id);
  try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type:'warn', title: locale==='ar'?'تمت إزالة المنتج':'Item removed', description: safe(item.name || item.title) + (locale==='ar'?' — تراجع؟':' — Undo?') } })); } catch {}
    // Provide 5s undo
    if (undo?.timeoutId) clearTimeout(undo.timeoutId);
    const timeoutId = setTimeout(() => setUndo(null), 5000);
    setUndo({ item, timeoutId });
  };

  const undoRemove = () => {
    if (!undo?.item) return;
    const it = undo.item;
    setUndo((prev) => { if (prev?.timeoutId) clearTimeout(prev.timeoutId); return null; });
    // Re-add the item (respects auth requirement in context)
    addToCart?.(it, it.quantity || 1);
  };

  // Keyboard handler for quantity input: allow arrows and Enter
  const onQtyKeyDown = (e, item) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault(); updateQuantity?.(item.id, (item.quantity || 1) + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); updateQuantity?.(item.id, Math.max(1, (item.quantity || 1) - 1));
    } else if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="container-custom px-4 py-16">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h2>
            <p className="text-gray-600 mb-8">لم تقم بإضافة أي منتجات إلى سلة التسوق بعد</p>
            <ButtonLink to="/products" variant="primary" className="text-lg px-8 py-3">
              تصفح المنتجات
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container-custom px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">سلة التسوق</h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 flex items-center space-x-2 space-x-reverse disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!clearCart}
          >
            <Trash2 size={20} />
            <span>إفراغ السلة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* عناصر السلة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg">
              {/* Inline undo banner (appears when an item was removed) */}
              {undo?.item && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between">
                  <div className="text-sm text-yellow-800">{locale==='ar'?'تمت إزالة عنصر من السلة':'Item removed from cart'}</div>
                  <div className="flex items-center gap-2">
                    <Button className="text-sm px-3 py-1" variant="secondary" onClick={undoRemove}>{locale==='ar'?'تراجع':'Undo'}</Button>
                    <button className="text-sm text-gray-500" onClick={()=>{ if (undo?.timeoutId) { clearTimeout(undo.timeoutId); setUndo(null); } }}>{locale==='ar'?'إغلاق':'Dismiss'}</button>
                  </div>
                </div>
              )}
              <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const quantity = item?.quantity && item.quantity > 0 ? item.quantity : 1;
                const unitPrice = Number(item?.price ?? item?.salePrice ?? 0);
                const oldPrice = Number(item?.oldPrice ?? item?.originalPrice ?? NaN);
                const lineTotal = unitPrice * quantity;
                const limit = typeof maxPerItem === 'number' ? maxPerItem : 10;
                const canDecrease = quantity > 1;
                const canIncrease = quantity < limit;
                const decreaseLabel = locale === 'ar' ? 'إنقاص الكمية' : 'Decrease quantity';
                const increaseLabel = locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity';
                const removeLabel = locale === 'ar' ? 'إزالة من السلة' : 'Remove from cart';
                const saved = Number.isFinite(oldPrice) && oldPrice > unitPrice ? (oldPrice - unitPrice) * quantity : 0;
                const hasStockInfo = typeof item?.stock === 'number';
                const lowStock = hasStockInfo && quantity >= item.stock;

                return (
                  <motion.div
                    key={item.id || `${index}-${quantity}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-6 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <LazyImage
                        src={item.images?.[0] || '/images/hero-image.svg'}
                        alt={safe(item.name || item.title)}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        sizes="80px"
                        width={80}
                        height={80}
                        decoding="async"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg mb-2 truncate">{safe(item.name || item.title)}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>
                            السعر:{' '}
                            <span className="font-semibold text-gray-900">{formatCurrency(unitPrice)}</span>
                            {Number.isFinite(oldPrice) && oldPrice > unitPrice && (
                              <span className="ms-2 line-through opacity-60">{formatCurrency(oldPrice)}</span>
                            )}
                          </span>
                          <span>
                            الإجمالي:{' '}
                            <span className="font-semibold text-gray-900">{formatCurrency(lineTotal)}</span>
                          </span>
                          {saved > 0 && (
                            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                              {locale==='ar' ? `وفرت ${formatCurrency(saved)}` : `Saved ${formatCurrency(saved)}`}
                            </span>
                          )}
                          {lowStock && (
                            <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-semibold">
                              {locale==='ar' ? `المتاح الآن: ${item.stock}` : `Available: ${item.stock}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => canDecrease && updateQuantity?.(item.id, Math.max(1, quantity - 1))}
                          onPointerDown={() => onHoldStart(() => canDecrease && updateQuantity?.(item.id, Math.max(1, (typeof items?.find==='function'? (items.find(it=>it.id===item.id)?.quantity||1) : quantity) - 1)))}
                          onPointerUp={onHoldEnd}
                          onPointerCancel={onHoldEnd}
                          onPointerLeave={onHoldEnd}
                          className="px-3 py-1 text-gray-600 hover:text-primary-red disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={decreaseLabel}
                          disabled={!canDecrease || !updateQuantity}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          aria-label={locale==='ar' ? 'كمية المنتج' : 'Quantity'}
                          type="number"
                          min={1}
                          max={limit}
                          value={quantity}
                          onChange={(e) => {
                            const v = Math.max(1, Math.min(limit, Number(e.target.value || 1)));
                            updateQuantity?.(item.id, v);
                          }}
                          onKeyDown={(e) => onQtyKeyDown(e, item)}
                          className="px-4 py-1 border-l border-r border-gray-300 min-w-12 text-center text-sm font-semibold appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => canIncrease && updateQuantity?.(item.id, quantity + 1)}
                          onPointerDown={() => onHoldStart(() => {
                            if (!canIncrease) return;
                            const cur = typeof items?.find==='function' ? (items.find(it=>it.id===item.id)?.quantity||1) : quantity;
                            const next = Math.min((typeof maxPerItem==='number'?maxPerItem:10), cur + 1);
                            if (next === cur) return;
                            updateQuantity?.(item.id, next);
                          })}
                          onPointerUp={onHoldEnd}
                          onPointerCancel={onHoldEnd}
                          onPointerLeave={onHoldEnd}
                          className="px-3 py-1 text-gray-600 hover:text-primary-red disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={increaseLabel}
                          disabled={!canIncrease || !updateQuantity}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={removeLabel}
                        disabled={!removeFromCart}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المنتجات:</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع:</span>
                  <span>{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن:</span>
                  <span className="text-green-600">مجاني</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span className="text-primary-red">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                {remainingForFreeShipping > 0 ? (
                  <div className="text-xs text-gray-600">
                    أضف{' '}
                    <strong className="text-primary-red">{formatCurrency(remainingForFreeShipping)}</strong>{' '}
                    للحصول على شحن مجاني
                    <div className="h-2 bg-gray-200 rounded mt-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-green-700">✓ شحن مجاني مفعّل</div>
                )}
              </div>
              <div className="flex gap-2 mb-4">
                <input value={couponCode} onChange={e=>setCouponCode(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" placeholder="كود خصم (اختياري)" />
                <Button variant="secondary" className="text-sm" onClick={applyCoupon} type="button">تطبيق</Button>
              </div>
              <ButtonLink to="/checkout" variant="primary" className="w-full py-3 text-lg mb-4 text-center block">
                إتمام الشراء
              </ButtonLink>
              <Link
                to="/products"
                className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600 hover:text-primary-red transition-colors"
              >
                <ArrowLeft size={20} />
                <span>مواصلة التسوق</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="region" aria-label={locale==='ar'?'شريط الدفع':'Checkout bar'}>
        <div className="mx-3 mb-3 rounded-2xl shadow-2xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border border-gray-200 p-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-600">الإجمالي</div>
            <div className="text-lg font-extrabold text-gray-900">{formatCurrency(totalValue)}</div>
            {remainingForFreeShipping > 0 ? (
              <div className="text-[11px] text-gray-600">
                أضف {formatCurrency(remainingForFreeShipping)} للشحن المجاني
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700">✓ شحن مجاني</div>
            )}
          </div>
          <ButtonLink to="/checkout" variant="primary" className="px-5 py-3 text-base font-bold" aria-disabled={totalValue<=0} tabIndex={totalValue<=0? -1 : 0}>إتمام الشراء</ButtonLink>
        </div>
      </div>
    </div>
  );
};

export default Cart;