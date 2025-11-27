import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from '../../lib/framerLazy';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, ArrowRight, Sparkles, Truck } from 'lucide-react';

const formatPrice = (n, locale = 'en') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(n || 0);
  } catch {
    return (n || 0).toFixed(2) + ' SAR';
  }
};

export default function CartPanel({ onClose, items, total, locale, t, updateQuantity }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  const translateIfAvailable = (key, params) => {
    if (typeof t !== 'function') return null;
    const value = t(key, params);
    if (!value || value === key) return null;
    return value;
  };

  const hasItems = useMemo(() => Array.isArray(items) && items.length > 0, [items]);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const itemCount = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + Number(item?.quantity || 1), 0);
  }, [items]);

  const itemSummary = useMemo(() => {
    if (!itemCount) return '';
    if (locale === 'ar') {
      return itemCount === 1 ? 'منتج واحد' : `${itemCount} منتجات`;
    }
    if (locale === 'fr') {
      return itemCount === 1 ? '1 article' : `${itemCount} articles`;
    }
    return itemCount === 1 ? '1 item' : `${itemCount} items`;
  }, [itemCount, locale]);

  const FREE_SHIPPING_THRESHOLD = 500;
  const orderTotal = Number(total || 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - orderTotal);
  const qualifiesForFreeShipping = hasItems && remainingForFreeShipping <= 0;
  const clampedProgress = FREE_SHIPPING_THRESHOLD
    ? Math.min(100, Math.max(0, (orderTotal / FREE_SHIPPING_THRESHOLD) * 100))
    : 0;
  const progressPositionStyle = useMemo(() => {
    const width = `${clampedProgress}%`;
    return locale === 'ar' ? { width, right: 0 } : { width, left: 0 };
  }, [clampedProgress, locale]);
  const progressPercentLabel = Math.round(clampedProgress);

  const shippingHeadline = qualifiesForFreeShipping
    ? translateIfAvailable('featureFreeShippingTitle') || (locale === 'ar' ? 'شحن مجاني' : locale === 'fr' ? 'Livraison gratuite' : 'Free Shipping')
    : locale === 'ar'
      ? 'اقتربت من الشحن المجاني'
      : locale === 'fr'
        ? 'Presque la livraison gratuite'
        : 'Almost there for free shipping';

  const shippingMessage = (() => {
    if (!hasItems) return '';
    if (qualifiesForFreeShipping) {
      const translated = translateIfAvailable('freeShippingAchieved');
      if (translated) return translated;
      if (locale === 'ar') return 'مبروك! الشحن المجاني مفعّل.';
      if (locale === 'fr') return 'Bravo ! Livraison gratuite activée.';
      return 'Nice! Free shipping unlocked.';
    }
    const amountCeil = Math.ceil(remainingForFreeShipping);
    const translatedHint = translateIfAvailable('freeShippingHint', { amount: amountCeil });
    if (translatedHint) return translatedHint;
    if (locale === 'ar') return `أضِف ${amountCeil} ر.س للحصول على شحن مجاني.`;
    if (locale === 'fr') return `Ajoutez ${amountCeil} SAR pour profiter de la livraison gratuite.`;
    return `Add ${amountCeil} SAR for free shipping.`;
  })();

  const shippingTotalLabel = qualifiesForFreeShipping
    ? translateIfAvailable('featureFreeShippingTitle') || (locale === 'ar' ? 'شحن مجاني' : locale === 'fr' ? 'Livraison gratuite' : 'Free Shipping')
    : locale === 'ar'
      ? 'إجمالي الطلب'
      : locale === 'fr'
        ? 'Total commande'
        : 'Order total';

  const showFreeShippingBanner = hasItems && FREE_SHIPPING_THRESHOLD > 0;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const panelMotion = reduceMotion
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
      };

  const handleQuantity = (id, next) => {
    if (!updateQuantity) return;
    if (next < 1) return;
    updateQuantity(id, next);
  };

  const title = t('cartTitle') || 'سلة التسوق';
  const subtitle = hasItems
    ? t('cartHasItemsSubtitle') || (t('cartSubtitle') && t('cartSubtitle') !== 'cartSubtitle' ? t('cartSubtitle') : 'راجع الطلبات وواصل الدفع')
    : t('cartEmptySubtitle') || 'سلتك بانتظار اختيار منتجاتك';

  return (
    <motion.aside
      id="cart-panel"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-panel-title"
      aria-describedby="cart-panel-description"
      tabIndex={-1}
      {...panelMotion}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-4 bottom-4 top-auto w-auto max-w-md overflow-hidden rounded-[32px] border border-white/60 bg-white/90 p-0 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-colors dark:border-white/8 dark:bg-slate-900/90 md:right-8 md:top-24 md:bottom-auto md:inset-x-auto"
    >
      <span className="pointer-events-none absolute -top-20 right-[-25%] h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/12" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-16 left-[-20%] h-40 w-40 rounded-full bg-sky-400/16 blur-3xl dark:bg-sky-500/12" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4 dark:border-white/10">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="cart-panel-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            {itemSummary ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-3 py-1 text-[0.72rem] font-semibold text-emerald-600 backdrop-blur-sm dark:text-emerald-300">
                <Sparkles size={14} aria-hidden="true" />
                {itemSummary}
              </span>
            ) : null}
          </div>
          <p
            className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-amber-500"
            id="cart-panel-description"
          >
            {subtitle}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={t('close') || 'إغلاق'}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      {showFreeShippingBanner && (
        <div className="relative z-10 px-5 pt-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-[0_24px_45px_-28px_rgba(16,185,129,0.85)]">
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_60%)] opacity-30" aria-hidden="true" />
            <div className="relative flex items-start gap-3 p-4">
              <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <Truck size={20} aria-hidden="true" />
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70">
                  {shippingHeadline}
                </p>
                <p className="text-sm font-medium leading-relaxed text-white/95">
                  {shippingMessage}
                </p>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/75">
                    <span>{shippingTotalLabel}</span>
                    {!qualifiesForFreeShipping && <span>{`${progressPercentLabel}%`}</span>}
                  </div>
                  <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/25">
                    <motion.span
                      layout
                      className="absolute inset-y-0 rounded-full bg-white shadow-[0_6px_12px_-6px_rgba(15,118,110,0.85)]"
                      style={progressPositionStyle}
                      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="relative max-h-80 overflow-y-auto px-5 py-4"
        style={{ scrollBehavior: hasItems ? 'smooth' : 'auto' }}
        role="region"
        aria-live="polite"
      >
        {hasItems ? (
          <ul className="flex flex-col gap-4" role="list">
            {items.map((item) => {
              const quantity = Number(item.quantity || 1);
              const unitPrice = Number(item.salePrice ?? item.price ?? 0);
              const lineTotal = unitPrice * quantity;
              const name = item.name || item.title || t('untitledProduct') || 'منتج';

              return (
                <li
                  key={item.id}
                  className="group relative flex items-start gap-4 overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_-30px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-slate-900/75"
                  role="listitem"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  <img
                    src={item.images?.[0] || item.image || '/images/hero-image.svg'}
                    alt={name}
                    className="relative z-10 h-20 w-20 flex-shrink-0 rounded-2xl object-cover shadow-inner ring-1 ring-white/70 dark:ring-white/10"
                    loading="lazy"
                  />

                  <div className="relative z-10 flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">{name}</h4>
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-500/90">
                          {t('cartLineUnit') || 'عنصر في القائمة'}
                        </p>
                      </div>
                      <div className="text-right text-base font-semibold text-emerald-600 dark:text-emerald-300">
                        {formatPrice(lineTotal, locale)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-1.5 py-1 text-slate-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] transition dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100" role="group" aria-label={t('quantityLabel') || 'Quantity'}>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item.id, quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:hover:bg-slate-800"
                          aria-label={t('decreaseQuantity') || 'تقليل الكمية'}
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100" aria-live="polite">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item.id, quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:hover:bg-slate-800"
                          aria-label={t('increaseQuantity') || 'زيادة الكمية'}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('cartLinePrice', { price: formatPrice(unitPrice, locale) }) || `${formatPrice(unitPrice, locale)} / ${t('unit', { defaultValue: 'وحدة' })}`}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="relative flex min-h-[240px] flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border border-dashed border-emerald-200/60 bg-gradient-to-b from-white/85 via-slate-50/70 to-emerald-50/60 p-8 text-center shadow-inner dark:border-emerald-500/25 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/40">
            <span className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-2xl" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-[0_12px_25px_-18px_rgba(16,185,129,0.8)] dark:text-emerald-300">
              <ShoppingCart size={30} aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('emptyCartTitle') || 'سلتك جاهزة للتسوق'}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('emptyCartMessage') || 'أضف منتجاتك المفضلة وابدأ تجربة تسوق سهلة.'}
              </p>
            </div>
            <Link
              to="/products"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_-20px_rgba(16,185,129,0.9)] transition hover:shadow-[0_24px_45px_-20px_rgba(15,118,110,0.95)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            >
              {t('startShopping') || t('ctaBrowseProducts') || 'ابدأ التسوق'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      <footer className="relative z-10 space-y-4 border-t border-white/50 px-5 py-4 backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-slate-100">
          <span>{t('totalLabel') || 'الإجمالي'}</span>
          <span>{formatPrice(total, locale)}</span>
        </div>
        {itemSummary && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {itemSummary}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/cart"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {t('cart') || 'عرض السلة'}
          </Link>
          <Link
            to="/checkout"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_22px_45px_-25px_rgba(16,185,129,0.95)] transition hover:shadow-[0_26px_55px_-25px_rgba(15,118,110,0.95)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            {t('proceedCheckout') || 'إتمام الشراء'}
          </Link>
        </div>
      </footer>
    </motion.aside>
  );
}
