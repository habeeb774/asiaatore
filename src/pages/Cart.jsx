import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeName } from '../utils/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import LazyImage from '../components/common/LazyImage';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart, maxPerItem } = useCart() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  const resolveName = (n) => localizeName({ name: n }, locale);
  const items = cartItems || [];
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

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="container-custom px-4 py-16">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h2>
            <p className="text-gray-600 mb-8">لم تقم بإضافة أي منتجات إلى سلة التسوق بعد</p>
            <Link to="/products" className="btn-primary text-lg px-8 py-3">
              تصفح المنتجات
            </Link>
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
              {items.map((item, index) => {
                const quantity = item?.quantity && item.quantity > 0 ? item.quantity : 1;
                const unitPrice = Number(item?.price ?? item?.salePrice ?? 0);
                const lineTotal = unitPrice * quantity;
                const limit = typeof maxPerItem === 'number' ? maxPerItem : 10;
                const canDecrease = quantity > 1;
                const canIncrease = quantity < limit;
                const decreaseLabel = locale === 'ar' ? 'إنقاص الكمية' : 'Decrease quantity';
                const increaseLabel = locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity';
                const removeLabel = locale === 'ar' ? 'إزالة من السلة' : 'Remove from cart';

                return (
                  <motion.div
                    key={item.id || `${index}-${quantity}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-6 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <LazyImage
                        src={item.images?.[0] || '/images/placeholder.jpg'}
                        alt={resolveName(item.name || item.title)}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        sizes="80px"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg mb-2 truncate">{resolveName(item.name || item.title)}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>
                            السعر:{' '}
                            <span className="font-semibold text-gray-900">{formatCurrency(unitPrice)}</span>
                          </span>
                          <span>
                            الإجمالي:{' '}
                            <span className="font-semibold text-gray-900">{formatCurrency(lineTotal)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => canDecrease && updateQuantity?.(item.id, Math.max(1, quantity - 1))}
                          className="px-3 py-1 text-gray-600 hover:text-primary-red disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={decreaseLabel}
                          disabled={!canDecrease || !updateQuantity}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-1 border-l border-r border-gray-300 min-w-12 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => canIncrease && updateQuantity?.(item.id, quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-primary-red disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={increaseLabel}
                          disabled={!canIncrease || !updateQuantity}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart?.(item.id)}
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
                <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="كود خصم (اختياري)" />
                <button className="btn-secondary text-sm">تطبيق</button>
              </div>
              <Link to="/checkout" className="btn-primary w-full py-3 text-lg mb-4 text-center block">
                إتمام الشراء
              </Link>
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
    </div>
  );
};

export default Cart;