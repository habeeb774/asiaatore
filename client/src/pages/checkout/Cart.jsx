import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { resolveLocalized } from '../../utils/locale';
import { Link } from 'react-router-dom';
import Button, { ButtonLink } from '../../components/ui/Button';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import SafeImage from '../../components/common/SafeImage';
import { CartSkeleton } from '../../components/shared/PageSkeletons';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart, clearOldCartData, loadOldCartData, hasOldCartData, maxPerItem, addToCart, loading: cartLoading, error: cartError } = useCart() || {};

  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  // Safe localization wrapper for names/titles/alt
  const safe = (v) => String(resolveLocalized(v, locale) || '');
  const items = cartItems || [];
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return localStorage.getItem('my_store_cart_coupon') || '';
    } catch {
      return '';
    }
  });
  const [undo, setUndo] = useState(null); // { item, timeoutId }
  const [loadingStates, setLoadingStates] = useState({}); // Track loading states for operations
  const [updateAnimations, setUpdateAnimations] = useState({}); // Track update animations
  const [cartViewMode, setCartViewMode] = useState(() => {
    try {
      return localStorage.getItem('my_store_cart_view_mode') || 'detailed';
    } catch {
      return 'detailed';
    }
  });
  const [error, setError] = useState(null); // General error state
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const holdTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // Confirmation dialog state
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
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight || 0) * (item.quantity || 1)), 0);
  const hasWeights = items.some(item => item.weight);
  const hasDimensions = items.some(item => item.dimensions);

  // Free shipping calculation
  const FREE_SHIPPING_THRESHOLD = 200; // SAR
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalValue);
  const progressToFreeShipping = Math.min(100, (totalValue / FREE_SHIPPING_THRESHOLD) * 100);

  const summaryChips = useMemo(() => ([
    {
      key: 'items',
      label: locale === 'ar' ? 'منتجات مختارة' : 'Curated items',
      value: itemCount,
      hint: locale === 'ar' ? 'يمكنك تعديل الكميات في أي وقت' : 'Adjust quantities anytime'
    },
    {
      key: 'savings',
      label: locale === 'ar' ? 'إجمالي التوفير' : 'Total savings',
      value: items.reduce((sum, item) => {
        const unit = Number(item.price ?? item.salePrice ?? 0);
        const old = Number(item.oldPrice ?? item.originalPrice ?? NaN);
        if (!Number.isFinite(old) || old <= unit) return sum;
        return sum + (old - unit) * (item.quantity || 1);
      }, 0),
      format: true,
      hint: locale === 'ar' ? 'استفد من عروض اليوم' : 'Tap into today’s offers'
    },
    {
      key: 'shipping',
      label: locale === 'ar' ? 'الشحن المجاني' : 'Complimentary shipping',
      value: remainingForFreeShipping <= 0,
      hint: remainingForFreeShipping <= 0
        ? (locale === 'ar' ? 'تم تفعيل الشحن المجاني' : 'Complimentary shipping unlocked')
        : (locale === 'ar'
            ? `أضف ${formatCurrency(remainingForFreeShipping)} فقط`
            : `Add ${formatCurrency(remainingForFreeShipping)} more`)
    }
  ]), [formatCurrency, itemCount, items, locale, remainingForFreeShipping]);

  const premiumBackground = (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" aria-hidden="true" />
      <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
      <div className="absolute top-40 right-0 h-[28rem] w-[28rem] translate-x-1/3 rounded-full bg-amber-400/10 blur-[140px]" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
    </div>
  );

  const effectiveError = (() => {
    if (error) return error;
    if (!cartError) return null;
    if (cartError === 'AUTH_REQUIRED') {
      return locale === 'ar'
        ? 'يرجى تسجيل الدخول لإدارة سلة التسوق.'
        : 'Please sign in to manage your cart.';
    }
    return cartError;
  })();

  // Helper functions for loading states
  const setLoading = (key, loading) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key) => loadingStates[key] || false;

  // Helper functions for animations
  const triggerUpdateAnimation = (key) => {
    setUpdateAnimations(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setUpdateAnimations(prev => ({ ...prev, [key]: false }));
    }, 500);
  };

  const hasUpdateAnimation = (key) => updateAnimations[key] || false;

  // Confirmation dialog functions
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog(null);
  };

  // Error handling function
  const handleError = (error, context = 'operation') => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = error?.message || error?.toString() || (locale === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    setError(errorMessage);
    
    try {
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          type: 'error',
          title: locale === 'ar' ? 'خطأ' : 'Error',
          description: errorMessage
        }
      }));
    } catch {}
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (itemId) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left to remove item
      onRemove({ id: itemId }, false);
    } else if (isRightSwipe) {
      // Swipe right to increase quantity
      const item = items.find(i => i.id === itemId);
      if (item) {
        handleUpdateQuantity(itemId, (item.quantity || 1) + 1);
      }
    }
  };

  const handleClearCart = () => {
    const title = locale === 'ar' ? 'تأكيد إفراغ السلة' : 'Confirm Clear Cart';
    const message = locale === 'ar'
      ? `هل أنت متأكد من رغبتك في إفراغ السلة؟ سيتم حذف جميع المنتجات (${itemCount} منتج).`
      : `Are you sure you want to clear your cart? All items (${itemCount} products) will be removed.`;

    showConfirmDialog(title, message, async () => {
      setLoading('clearCart', true);
      hideConfirmDialog();
      try {
        await clearCart();
        try {
          window.dispatchEvent(new CustomEvent('toast:show', {
            detail: {
              type: 'success',
              title: locale === 'ar' ? 'تم إفراغ السلة' : 'Cart cleared',
              description: locale === 'ar' ? 'تم حذف جميع المنتجات من سلة التسوق' : 'All items have been removed from your cart'
            }
          }));
        } catch {}
      } catch (error) {
        handleError(error, 'clearCart');
      } finally {
        setLoading('clearCart', false);
      }
    });
  };

  // Cleanup any timers on unmount
  useEffect(() => () => { clearInterval(repeatTimerRef.current); clearTimeout(holdTimerRef.current); }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      try {
        window.dispatchEvent(new CustomEvent('toast:show', {
          detail: {
            type: 'warn',
            title: locale === 'ar' ? 'تحذير' : 'Warning',
            description: locale === 'ar' ? 'يرجى إدخال كود الكوبون' : 'Please enter a coupon code'
          }
        }));
      } catch {}
      return;
    }

    setLoading('coupon', true);
    try {
      // Backend route not implemented; present a friendly message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      try {
        window.dispatchEvent(new CustomEvent('toast:show', {
          detail: {
            type: 'info',
            title: locale === 'ar' ? 'قريباً' : 'Coming soon',
            description: locale === 'ar' ? 'تطبيق الكوبونات سيكون متاحاً قريباً' : 'Coupon application will be available soon'
          }
        }));
      } catch {}
    } catch (error) {
      handleError(error, 'applyCoupon');
    } finally {
      setLoading('coupon', false);
    }
  };

  const onRemove = async (item, skipConfirm = false) => {
    const itemId = item.id;

    if (!skipConfirm) {
      const title = locale === 'ar' ? 'تأكيد إزالة المنتج' : 'Confirm Remove Item';
      const message = locale === 'ar'
        ? `هل أنت متأكد من رغبتك في إزالة "${safe(item.name || item.title)}" من السلة؟`
        : `Are you sure you want to remove "${safe(item.name || item.title)}" from your cart?`;

      showConfirmDialog(title, message, () => onRemove(item, true));
      return;
    }

    setLoading(`remove-${itemId}`, true);
    triggerUpdateAnimation(`remove-${itemId}`);
    try {
      removeFromCart?.(itemId);
      try {
        window.dispatchEvent(new CustomEvent('toast:show', {
          detail: {
            type: 'warn',
            title: locale === 'ar' ? 'تمت إزالة المنتج' : 'Item removed',
            description: safe(item.name || item.title) + (locale === 'ar' ? ' — تراجع؟' : ' — Undo?')
          }
        }));
      } catch {}
      // Provide 5s undo
      if (undo?.timeoutId) clearTimeout(undo.timeoutId);
      const timeoutId = setTimeout(() => setUndo(null), 5000);
      setUndo({ item, timeoutId });
    } catch (error) {
      handleError(error, 'removeItem');
    } finally {
      setLoading(`remove-${itemId}`, false);
    }
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
      e.preventDefault();
      handleUpdateQuantity(item.id, (item.quantity || 1) + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1));
    } else if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    setLoading(`quantity-${productId}`, true);
    try {
      updateQuantity?.(productId, quantity);
      triggerUpdateAnimation(`quantity-${productId}`);
      try {
        window.dispatchEvent(new CustomEvent('toast:show', {
          detail: {
            type: 'success',
            title: locale === 'ar' ? 'تم تحديث الكمية' : 'Quantity updated',
            description: locale === 'ar' ? `تم تحديث كمية المنتج إلى ${quantity}` : `Product quantity updated to ${quantity}`
          }
        }));
      } catch {}
    } catch (error) {
      handleError(error, 'updateQuantity');
    } finally {
      setLoading(`quantity-${productId}`, false);
    }
  };

  if (cartLoading && items.length === 0) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="relative min-h-screen bg-slate-950 pt-24">
        {premiumBackground}
        <div className="container-custom px-4 py-16">
          <div className="mx-auto max-w-xl overflow-hidden rounded-4xl border border-white/10 bg-white/5 p-10 text-center text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
              <ShoppingBag size={36} className="text-white/70" />
            </div>
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">{locale === 'ar' ? 'سلة التسوق فارغة' : 'Your cart feels empty'}</h2>
            <p className="mb-8 text-sm text-white/70">
              {locale === 'ar'
                ? 'اكتشف تشكيلتنا المنتقاة بعناية وأضف المنتجات المفضلة لديك'
                : 'Explore our curated collection and add pieces that speak to you.'}
            </p>
            <ButtonLink to="/products" variant="primary" className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold">
              {locale === 'ar' ? 'تصفح المنتجات' : 'Browse the boutique'}
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 pt-24 text-white">
      {premiumBackground}
      <div className="container-custom relative px-4 pb-12">
        {cartLoading && items.length > 0 && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
            {locale === 'ar'
              ? 'جاري مزامنة سلة التسوق مع حسابك...'
              : 'Syncing your cart with your account...'}
          </div>
        )}
        {/* Error Banner */}
        {effectiveError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-medium">{effectiveError}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
        {/* Mobile swipe hints */}
        {isMobile && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center"
          >
            <p className="text-blue-800 text-sm">
              💡 {locale === 'ar' ? 'اسحب يميناً للزيادة، يساراً للحذف' : 'Swipe right to increase, left to remove'}
            </p>
          </motion.div>
        )}
        <section className="mb-10 rounded-4xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                {locale === 'ar' ? 'تجربة تسوق مخصصة' : 'A bespoke shopping journey'}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                {locale === 'ar' ? 'سلة التسوق' : 'Your curated cart'}
              </h1>
              <p className="mt-3 text-sm text-white/70">
                {locale === 'ar'
                  ? 'راجع اختياراتك بعناية وأكمل الطلب بخطوة واحدة.'
                  : 'Review your refined selections and glide through checkout with ease.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCartViewMode(cartViewMode === 'detailed' ? 'compact' : 'detailed')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                title={locale === 'ar' ? 'تبديل وضع العرض' : 'Toggle view mode'}
              >
                <span>{cartViewMode === 'detailed' ? (locale === 'ar' ? 'عرض مختصر' : 'Compact view') : (locale === 'ar' ? 'عرض مفصل' : 'Detailed view')}</span>
              </button>
              <button
                onClick={handleClearCart}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!clearCart || isLoading('clearCart')}
              >
                {isLoading('clearCart') ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-transparent" />
                ) : (
                  <Trash2 size={18} />
                )}
                <span>{isLoading('clearCart') ? (locale === 'ar' ? 'جاري الإفراغ...' : 'Clearing...') : (locale === 'ar' ? 'إفراغ السلة' : 'Clear cart')}</span>
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {summaryChips.map((chip) => (
              <motion.div
                key={chip.key}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              >
                <p className="text-[0.68rem] uppercase tracking-[0.35em] text-white/50">{chip.label}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {chip.format ? formatCurrency(chip.value) : (typeof chip.value === 'boolean' ? (chip.value ? '✓' : '...') : chip.value)}
                  </span>
                  {chip.key === 'shipping' && typeof chip.value === 'boolean' && (
                    <span className={`text-xs font-semibold ${chip.value ? 'text-emerald-300' : 'text-amber-200'}`}>
                      {chip.value ? (locale === 'ar' ? 'جاهز للشحن' : 'Ready to ship') : (locale === 'ar' ? 'أضف المزيد' : 'Keep adding')}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/60">{chip.hint}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* تحذير البيانات القديمة */}
          {hasOldCartData && cartItems.length === 0 && (
            <div className="lg:col-span-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800">
                      {locale === 'ar' ? 'بيانات سلة محفوظة' : 'Saved Cart Data'}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {locale === 'ar' 
                        ? 'لديك منتجات محفوظة من جلسة سابقة. هل تريد تحميلها أم البدء بسلة جديدة؟'
                        : 'You have products saved from a previous session. Would you like to load them or start with a fresh cart?'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadOldCartData}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {locale === 'ar' ? 'تحميل المنتجات' : 'Load Products'}
                    </button>
                    <button
                      onClick={clearOldCartData}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {locale === 'ar' ? 'تجاهل' : 'Ignore'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* عناصر السلة */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              {/* Inline undo banner (appears when an item was removed) */}
              {undo?.item && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100"
                >
                  <div className="text-sm text-yellow-800">{locale==='ar'?'تمت إزالة عنصر من السلة':'Item removed from cart'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button className="text-sm px-3 py-1" variant="secondary" onClick={undoRemove}>{locale==='ar'?'تراجع':'Undo'}</Button>
                    <button className="text-sm text-gray-500 hover:text-gray-700" onClick={()=>{ if (undo?.timeoutId) { clearTimeout(undo.timeoutId); setUndo(null); } }}>{locale==='ar'?'إغلاق':'Dismiss'}</button>
                  </div>
                </motion.div>
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
                    initial={{ opacity: 0, y: 24 }}
                    animate={{
                      opacity: hasUpdateAnimation(`remove-${item.id}`) ? 0.45 : 1,
                      y: 0,
                      scale: hasUpdateAnimation(`remove-${item.id}`) ? 0.96 : 1
                    }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-6 border-b border-white/5 p-6 transition-colors duration-200 last:border-b-0 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                    onTouchStart={isMobile ? handleTouchStart : undefined}
                    onTouchMove={isMobile ? handleTouchMove : undefined}
                    onTouchEnd={isMobile ? () => handleTouchEnd(item.id) : undefined}
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="relative">
                        <LazyImage
                          src={item.images?.[0] || '/images/hero-image.svg'}
                          alt={safe(item.name || item.title)}
                          className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover shadow-[0_20px_40px_-30px_rgba(15,23,42,0.8)]"
                          sizes="64px"
                          width={64}
                          height={64}
                          decoding="async"
                        />
                        {item.images && item.images.length > 1 && (
                          <div className="absolute -top-1 -right-1 bg-primary-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {item.images.length}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white">{safe(item.name || item.title)}</h3>
                        <div className="mb-2 flex flex-wrap items-center gap-4 text-sm text-white/70">
                          <span>
                            السعر:{' '}
                            <span className="font-semibold text-white">{formatCurrency(unitPrice)}</span>
                            {Number.isFinite(oldPrice) && oldPrice > unitPrice && (
                              <span className="ms-2 line-through opacity-60">{formatCurrency(oldPrice)}</span>
                            )}
                          </span>
                          <span>
                            الإجمالي:{' '}
                            <span className="font-semibold text-white">{formatCurrency(lineTotal)}</span>
                          </span>
                          {saved > 0 && (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-200 font-semibold">
                              {locale==='ar' ? `وفرت ${formatCurrency(saved)}` : `Saved ${formatCurrency(saved)}`}
                            </span>
                          )}
                          {lowStock && (
                            <span className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-0.5 text-red-200 font-semibold">
                              {locale==='ar' ? `المتاح الآن: ${item.stock}` : `Available: ${item.stock}`}
                            </span>
                          )}
                        </div>
                        {/* Additional product details */}
                        {cartViewMode === 'detailed' && (
                          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                            {item.sku && (
                              <span className="rounded px-2 py-1 bg-white/10">SKU: {item.sku}</span>
                            )}
                            {item.weight && (
                              <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-200">
                                {locale === 'ar' ? 'الوزن' : 'Weight'}: {item.weight}kg
                              </span>
                            )}
                            {item.brand && (
                              <span className="rounded bg-indigo-500/10 px-2 py-1 text-indigo-200">{item.brand}</span>
                            )}
                            {item.category && (
                              <span className="rounded bg-white/10 px-2 py-1">{item.category}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-inner transition-colors hover:border-emerald-300/40">
                        <button
                          type="button"
                          onClick={() => canDecrease && handleUpdateQuantity(item.id, Math.max(1, quantity - 1))}
                          onPointerDown={() => onHoldStart(() => canDecrease && handleUpdateQuantity(item.id, Math.max(1, (typeof items?.find==='function'? (items.find(it=>it.id===item.id)?.quantity||1) : quantity) - 1)))}
                          onPointerUp={onHoldEnd}
                          onPointerCancel={onHoldEnd}
                          onPointerLeave={onHoldEnd}
                          className="px-4 py-2 text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={decreaseLabel}
                          disabled={!canDecrease || !updateQuantity || isLoading(`quantity-${item.id}`)}
                        >
                          <Minus size={18} />
                        </button>
                        <input
                          aria-label={locale==='ar' ? 'كمية المنتج' : 'Quantity'}
                          type="number"
                          min={1}
                          max={limit}
                          value={quantity}
                          onChange={(e) => {
                            const v = Math.max(1, Math.min(limit, Number(e.target.value || 1)));
                            handleUpdateQuantity(item.id, v);
                          }}
                          onKeyDown={(e) => onQtyKeyDown(e, item)}
                          className="min-w-16 border-x border-white/10 bg-transparent px-4 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
                          disabled={isLoading(`quantity-${item.id}`)}
                        />
                        <button
                          type="button"
                          onClick={() => canIncrease && handleUpdateQuantity(item.id, quantity + 1)}
                          onPointerDown={() => onHoldStart(() => {
                            if (!canIncrease) return;
                            const cur = typeof items?.find==='function' ? (items.find(it=>it.id===item.id)?.quantity||1) : quantity;
                            const next = Math.min((typeof maxPerItem==='number'?maxPerItem:10), cur + 1);
                            if (next === cur) return;
                            handleUpdateQuantity(item.id, next);
                          })}
                          onPointerUp={onHoldEnd}
                          onPointerCancel={onHoldEnd}
                          onPointerLeave={onHoldEnd}
                          className="px-4 py-2 text-white/70 transition-colors hover:bg-emerald-500/20 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={increaseLabel}
                          disabled={!canIncrease || !updateQuantity || isLoading(`quantity-${item.id}`)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item, true)} // Quick remove without confirmation
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onRemove(item, false); // Remove with confirmation on right-click
                        }}
                        className="rounded-xl border border-red-300/30 p-3 text-red-200 transition-all duration-200 hover:bg-red-500/20 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={removeLabel}
                        disabled={!removeFromCart || isLoading(`remove-${item.id}`)}
                        title={locale === 'ar' ? 'انقر للإزالة السريعة، انقر بزر الفأرة الأيمن للتأكيد' : 'Click to quick remove, right-click for confirmation'}
                      >
                        {isLoading(`remove-${item.id}`) ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={18} />
                        )}
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
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">✓</div>
                {locale === 'ar' ? 'ملخص الطلب' : 'Order overview'}
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-white/70">
                  <span>{locale === 'ar' ? 'عدد المنتجات' : 'Items in cart'}:</span>
                  <span className="text-white">{itemCount}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>{locale === 'ar' ? 'المجموع' : 'Subtotal'}:</span>
                  <span className="text-white">{formatCurrency(totalValue)}</span>
                </div>
                {hasWeights && totalWeight > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>{locale === 'ar' ? 'الوزن الإجمالي' : 'Total weight'}:</span>
                    <span className="text-white">{totalWeight.toFixed(2)} kg</span>
                  </div>
                )}
                <div className="flex justify-between text-white/70">
                  <span>{locale === 'ar' ? 'الشحن' : 'Shipping'}:</span>
                  <span className="text-emerald-200">{remainingForFreeShipping > 0 ? (locale === 'ar' ? 'قابل للتفعيل' : 'Unlock with more') : (locale === 'ar' ? 'مجاني' : 'Complimentary')}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <motion.div
                    key={`total-${totalValue}`}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between text-lg font-bold text-white"
                  >
                    <span>الإجمالي:</span>
                    <span className="text-emerald-200">{formatCurrency(totalValue)}</span>
                  </motion.div>
                </div>
              </div>
              <div className="mb-4">
                {remainingForFreeShipping > 0 ? (
                  <motion.div
                    key={`shipping-${remainingForFreeShipping}`}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-gray-600"
                  >
                    أضف{' '}
                    <strong className="text-primary-red">{formatCurrency(remainingForFreeShipping)}</strong>{' '}
                    للحصول على شحن مجاني
                    <motion.div
                      className="h-2 bg-gray-200 rounded mt-2 overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <motion.div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToFreeShipping}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    className="text-xs text-green-700"
                  >
                    ✓ شحن مجاني مفعّل
                  </motion.div>
                )}
              </div>
              <div className="mb-4 flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 disabled:opacity-50"
                  placeholder={locale === 'ar' ? 'كود خصم (اختياري)' : 'Promo code (optional)'}
                  disabled={isLoading('coupon')}
                />
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={applyCoupon}
                  disabled={isLoading('coupon')}
                >
                  {isLoading('coupon') ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{locale === 'ar' ? 'تطبيق...' : 'Applying...'}</span>
                    </div>
                  ) : (
                    locale === 'ar' ? 'تطبيق' : 'Apply'
                  )}
                </Button>
              </div>
              <ButtonLink to="/checkout" variant="primary" className="mb-4 block w-full py-3 text-center text-lg">
                {locale === 'ar' ? 'إتمام الشراء' : 'Finalize the order'}
              </ButtonLink>
              <Link
                to="/products"
                className="flex items-center justify-center space-x-2 space-x-reverse text-white/70 transition-colors hover:text-emerald-200"
              >
                <ArrowLeft size={20} />
                <span>{locale === 'ar' ? 'مواصلة التسوق' : 'Continue browsing'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout bar */}
      {/* Sticky mobile checkout bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="region" aria-label={locale==='ar'?'شريط الدفع':'Checkout bar'}>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="mx-3 mb-3 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/90 border border-gray-200/50 p-4 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="text-xs text-gray-600 font-medium">الإجمالي ({itemCount} منتج)</div>
            <div className="text-xl font-extrabold text-gray-900 mb-1">{formatCurrency(totalValue)}</div>
            {remainingForFreeShipping > 0 ? (
              <div className="text-[11px] text-gray-600 bg-gray-100 px-2 py-1 rounded-full inline-block">
                أضف {formatCurrency(remainingForFreeShipping)} للشحن المجاني
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-block font-medium">
                ✓ شحن مجاني
              </div>
            )}
            {hasWeights && totalWeight > 0 && (
              <div className="text-[11px] text-gray-500 mt-1">
                الوزن: {totalWeight.toFixed(1)}kg
              </div>
            )}
          </div>
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <ButtonLink to="/checkout" variant="primary" className="px-6 py-4 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95" aria-disabled={totalValue<=0} tabIndex={totalValue<=0? -1 : 0}>إتمام الشراء</ButtonLink>
          </motion.div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={hideConfirmDialog}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={hideConfirmDialog}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={confirmDialog.onConfirm}
                >
                  {locale === 'ar' ? 'تأكيد' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
