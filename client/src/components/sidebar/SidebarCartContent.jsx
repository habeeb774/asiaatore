import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import SafeImage from '../common/SafeImage';

const SidebarCartContent = ({
  locale,
  closePanel,
  cartItems = [],
  cartTotal = 0,
  priceFormatter,
  handleRemoveFromCart,
  handleUpdateQuantity,
}) => {
  const hasItems = Array.isArray(cartItems) && cartItems.length > 0;

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between border-b border-slate-200/70 bg-white/90 px-6 py-5 dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="space-y-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-amber-500">
            {locale === 'ar' ? 'مقتنياتك' : 'Your Selection'}
          </p>
          <h2 id="cart-panel-title" className="text-lg font-semibold leading-6">
            {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
          </h2>
        </div>
        <button
          type="button"
          onClick={closePanel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={locale === 'ar' ? 'إغلاق سلة التسوق' : 'Close cart'}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300/70 dark:scrollbar-thumb-slate-700/70">
        {!hasItems ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-slate-500 dark:text-slate-300">
            <ShoppingCart size={36} className="text-amber-500" aria-hidden />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-100">
              {locale === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty'}
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {locale === 'ar'
                ? 'استكشف مجموعتنا الفاخرة من المنتجات وأضف ما تحبه بنقرة واحدة.'
                : 'Explore our curated collection and add something exquisite to your bag.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => {
              const quantity = Number(item.quantity ?? 1);
              const unitPrice = Number(item.salePrice ?? item.price ?? 0);
              const lineTotal = unitPrice * quantity;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/70 dark:ring-white/[0.04]"
                >
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl object-cover"
                  />

                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-5 text-slate-800 dark:text-slate-50">{item.name}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-500">
                          {locale === 'ar' ? 'منتج فاخر' : 'Signature Item'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart?.(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        aria-label={locale === 'ar' ? 'إزالة المنتج من السلة' : 'Remove item'}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity?.(item.id, quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-slate-800"
                          aria-label={locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity?.(item.id, quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-slate-800"
                          aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                          {locale === 'ar' ? 'السعر' : 'Unit price'}
                        </p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {priceFormatter?.format ? priceFormatter.format(unitPrice) : unitPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {locale === 'ar' ? 'المجموع الفرعي' : 'Line total'}: {priceFormatter?.format ? priceFormatter.format(lineTotal) : lineTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasItems && (
        <div className="border-t border-slate-200/70 bg-white/90 px-6 py-5 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/80">
          <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-slate-50">
            <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
            <span>{priceFormatter?.format ? priceFormatter.format(cartTotal ?? 0) : Number(cartTotal ?? 0).toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {locale === 'ar'
              ? 'جميع الأسعار تشمل الضريبة. استمتع بتجربة تسوق راقية وسريعة.'
              : 'Prices include applicable taxes. Enjoy a refined and fast checkout.'}
          </p>
          <Link
            to="/checkout"
            onClick={closePanel}
            className="mt-4 flex h-12 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-amber-500 dark:focus:ring-offset-slate-900"
          >
            {locale === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SidebarCartContent;
