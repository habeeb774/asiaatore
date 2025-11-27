import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { CurrencyDisplay } from '../shared/CurrencyDisplay';

const SidebarCart = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Use a more specific check to avoid closing when interacting with other elements that might be outside the panel but part of the UI
      if (isOpen && event.target.closest('#cart-panel-backdrop')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);


  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };
  
  const handleStartShopping = () => {
    onClose();
    navigate('/products');
  }

  if (!isOpen) return null;

  const renderEmptyCart = () => (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300/60 bg-slate-50/80 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/60">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-500/15">
        <ShoppingCart size={28} aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t('emptyCart', 'Your cart is empty')}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('emptyCartMessage', 'Looks like you haven\'t added anything to your cart yet.')}
        </p>
      </div>
      <button
        type="button"
        onClick={handleStartShopping}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
      >
        {t('shop_now', 'Start Shopping')}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );

  // Placeholder for the items list - will be styled in a follow-up
  const renderCartItems = () => (
     <div className="space-y-4">
      {cartItems.map((item) => (
        <div key={item.id} className="flex items-center space-x-4 rtl:space-x-reverse p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <Link
            to={`/products/${item.id}`}
            onClick={onClose}
            className="flex-shrink-0"
          >
            <LazyImage
              src={item.image}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              fallbackSrc="/placeholder-product.png"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              to={`/products/${item.id}`}
              onClick={onClose}
              className="block"
            >
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-emerald-600 dark:hover:text-emerald-400">
                {item.name}
              </h4>
            </Link>

            <div className="flex items-baseline gap-2">
                <CurrencyDisplay
                amount={item.price}
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1"
                />
                 {item.compare_at_price > item.price && (
                    <CurrencyDisplay
                    amount={item.compare_at_price}
                    className="text-xs text-slate-500 line-through"
                    />
                )}
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-full text-sm min-w-[2rem] text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating || item.quantity >= (item.stock || 10)}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
           <button
            onClick={() => removeFromCart(item.id)}
            disabled={isUpdating}
            className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );


  return (
    <>
      {/* Backdrop */}
      <div id="cart-panel-backdrop" className="fixed inset-0 bg-black/60 z-40 transition-opacity" />

      {/* Panel */}
      <aside
        id="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-panel-title"
        aria-describedby="cart-panel-description"
        tabIndex="-1"
        className="fixed inset-x-4 bottom-4 top-auto w-auto max-w-md rounded-3xl border border-slate-200/70 bg-white/95 p-0 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-slate-700/60 dark:bg-slate-900/95 md:right-8 md:top-24 md:bottom-auto md:inset-x-auto"
       >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/60">
          <div className="space-y-0.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-amber-500" id="cart-panel-description">
              {t('cart.subtitle', 'Your personal cart')}
            </p>
            <h3 id="cart-panel-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {t('cartTitle', 'Shopping Cart')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label={t('close', 'Close')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="relative max-h-80 overflow-y-auto px-5 py-4" role="region" aria-live="polite">
          {cartItems.length === 0 ? renderEmptyCart() : renderCartItems()}
        </div>

        <footer className="space-y-4 border-t border-slate-200/70 px-5 py-4 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span>{t('totalLabel', 'Total')}</span>
            <CurrencyDisplay amount={cartTotal} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleViewCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400"
            >
              {t('cart', 'Cart')}
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('proceedCheckout', 'Proceed to Checkout')}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
};

export default SidebarCart;
