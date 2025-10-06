import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeName } from '../utils/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import LazyImage from '../components/common/LazyImage';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart() || {};
  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
  const resolveName = (n) => localizeName({ name: n }, locale);
  const items = cartItems || [];

  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

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
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 flex items-center space-x-2 space-x-reverse"
          >
            <Trash2 size={20} />
            <span>إفراغ السلة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* عناصر السلة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-6 space-x-reverse p-6 border-b border-gray-100 last:border-b-0"
                >
                  <LazyImage
                    src={item.images?.[0] || '/images/placeholder.jpg'}
                    alt={resolveName(item.name || item.title)}
                    className="w-20 h-20 object-cover rounded-lg"
                    sizes="80px"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{resolveName(item.name || item.title)}</h3>
                    <p className="text-primary-red font-bold">{item.price} ر.س</p>
                  </div>

                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-3 py-1 text-gray-600 hover:text-primary-red"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-1 border-l border-r border-gray-300 min-w-12 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-gray-600 hover:text-primary-red"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المنتجات:</span>
                  <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع:</span>
                  <span>{total} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن:</span>
                  <span className="text-green-600">مجاني</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span className="text-primary-red">{total} ر.س</span>
                  </div>
                </div>
              </div>
              {/* تقدم الشحن المجاني */}
              <div className="mb-4">
                {total < 200 ? (
                  <div className="text-xs text-gray-600">
                    أضف <strong className="text-primary-red">{(200-total).toFixed(2)} ر.س</strong> للحصول على شحن مجاني
                    <div className="h-2 bg-gray-200 rounded mt-2 overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: Math.min(100, Math.round((total/200)*100)) + '%' }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-green-700">✓ شحن مجاني مفعّل</div>
                )}
              </div>
              {/* كوبون مبسّط */}
              <div className="flex gap-2 mb-4">
                <input className="border rounded px-3 py-2 text-sm flex-1" placeholder="كود خصم (اختياري)" />
                <button className="btn-secondary text-sm">تطبيق</button>
              </div>
              <Link to="/Checkout" >
              <button className="btn-primary w-full py-3 text-lg mb-4">
                إتمام الشراء
              </button>
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