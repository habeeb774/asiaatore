import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '../lib/framerLazy';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  ShoppingCart,
  Heart,
  User,
  Settings,
  CreditCard,
  MapPin,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import SafeImage from './common/SafeImage';
import { useLanguage } from '../stores/LanguageContext';
import { useCart } from '../stores/CartContext';

/**
 * مكون Sidebar الموحد - يجمع أفضل الميزات من مكونات Sidebar المختلفة
 *
 * الميزات المدعومة:
 * - عربة التسوق الجانبية مع إدارة المنتجات
 * - قائمة المفضلة
 * - معلومات المستخدم
 * - إعدادات الحساب
 * - روابط سريعة
 * - دعم اللغات المتعددة
 * - تأثيرات بصرية متقدمة
 * - وضع ملء الشاشة الاختياري
 * - دعم الوضع المظلم
 */
const Sidebar = ({
  isOpen,
  onClose,
  type = 'cart', // cart, menu, user, favorites
  position = 'right', // left, right
  size = 'md', // sm, md, lg
  initialFavorites = undefined,
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = ''
}) => {
  const { locale } = useLanguage();
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const previousFocusRef = useRef(null);

  // حالات المكون
  const [favorites, setFavorites] = useState(initialFavorites || []);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // نصوص الواجهة حسب اللغة
  const texts = {
    ar: {
      cart: {
        title: 'العربة',
        empty: 'العربة فارغة',
        total: 'المجموع',
        checkout: 'الدفع',
        continue: 'متابعة التسوق'
      },
      favorites: {
        title: 'المفضلة',
        empty: 'لا توجد منتجات مفضلة'
      },
      user: {
        title: 'الحساب',
        profile: 'الملف الشخصي',
        orders: 'الطلبات',
        addresses: 'العناوين',
        payments: 'طرق الدفع',
        settings: 'الإعدادات',
        help: 'المساعدة',
        logout: 'تسجيل الخروج'
      },
      menu: {
        title: 'القائمة',
        home: 'الرئيسية',
        products: 'المنتجات',
        categories: 'الفئات',
        offers: 'العروض',
        contact: 'اتصل بنا'
      },
      actions: {
        remove: 'إزالة',
        add: 'إضافة',
        quantity: 'الكمية',
        price: 'السعر'
      }
    },
    en: {
      cart: {
        title: 'Cart',
        empty: 'Cart is empty',
        total: 'Total',
        checkout: 'Checkout',
        continue: 'Continue Shopping'
      },
      favorites: {
        title: 'Favorites',
        empty: 'No favorite products'
      },
      user: {
        title: 'Account',
        profile: 'Profile',
        orders: 'Orders',
        addresses: 'Addresses',
        payments: 'Payments',
        settings: 'Settings',
        help: 'Help',
        logout: 'Logout'
      },
      menu: {
        title: 'Menu',
        home: 'Home',
        products: 'Products',
        categories: 'Categories',
        offers: 'Offers',
        contact: 'Contact'
      },
      actions: {
        remove: 'Remove',
        add: 'Add',
        quantity: 'Quantity',
        price: 'Price'
      }
    }
  };

  const t = texts[locale] || texts.en;

  // إعدادات الحجم
  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-80',
      md: 'w-96',
      lg: 'w-[28rem]'
    };
    return sizes[size] || sizes.md;
  };

  // إعدادات الموقع
  const getPositionClasses = () => {
    const positions = {
      left: 'left-0',
      right: 'right-0'
    };
    return positions[position] || positions.right;
  };

  // إغلاق الشريط الجانبي
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // إزالة منتج من العربة
  const handleRemoveFromCart = useCallback((productId) => {
    removeFromCart(productId);
  }, [removeFromCart]);

  // تحديث كمية المنتج
  const handleUpdateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      updateQuantity(productId, quantity);
    }
  }, [updateQuantity, handleRemoveFromCart]);

  // إزالة من المفضلة
  const handleRemoveFromFavorites = useCallback((productId) => {
    setFavorites(prev => prev.filter(item => item.id !== productId));
  }, []);

  // إغلاق بالضغط على ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (closeOnEscape && event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, handleClose]);

  // إدارة التركيز
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      if (sidebarRef.current) {
        const focusableElements = sidebarRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // منع التمرير في الخلفية
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // إغلاق بالضغط على الخلفية
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      handleClose();
    }
  };

  // روابط القائمة الجانبية
  const menuLinks = [
    { name: t.menu.home, path: '/', icon: '🏠' },
    { name: t.menu.products, path: '/products', icon: '📦' },
    { name: t.menu.categories, path: '/categories', icon: '📂' },
    { name: t.menu.offers, path: '/offers', icon: '🏷️' },
    { name: t.menu.contact, path: '/contact', icon: '📞' }
  ];

  // روابط حساب المستخدم
  const userLinks = [
    { name: t.user.profile, path: '/profile', icon: User },
    { name: t.user.orders, path: '/orders', icon: ShoppingCart },
    { name: t.user.addresses, path: '/addresses', icon: MapPin },
    { name: t.user.payments, path: '/payments', icon: CreditCard },
    { name: t.user.settings, path: '/settings', icon: Settings },
    { name: t.user.help, path: '/help', icon: HelpCircle }
  ];

  // عرض محتوى حسب النوع
  const renderContent = () => {
    switch (type) {
      case 'cart':
        return (
          <div className="flex flex-col h-full">
            {/* رأس العربة */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <ShoppingCart className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.cart.title}
                </h2>
                {cartItems?.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </div>

            {/* محتوى العربة */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems?.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t.cart.empty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      initial={{ opacity: 0, x: position === 'right' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: position === 'right' ? 20 : -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SafeImage
                        src={item.image || '/placeholder-product.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        loading="lazy"
                        sizes="(max-width: 640px) 64px, 80px"
                        onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t.actions.price}: ${item.price}
                        </p>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* أزرار العربة */}
            {cartItems?.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t.cart.total}:</span>
                  <span>${cartTotal?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    onClick={handleClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {t.cart.checkout}
                  </Link>

                  <button
                    onClick={handleClose}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {t.cart.continue}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'favorites':
        return (
          <div className="flex flex-col h-full">
            {/* رأس المفضلة */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Heart className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.favorites.title}
                </h2>
              </div>
            </div>

            {/* محتوى المفضلة */}
            <div className="flex-1 overflow-y-auto p-6">
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t.favorites.empty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      initial={{ opacity: 0, x: position === 'right' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: position === 'right' ? 20 : -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SafeImage
                        src={item.image || '/placeholder-product.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        loading="lazy"
                        sizes="(max-width: 640px) 64px, 80px"
                        onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${item.price}
                        </p>
                      </div>

                      <div className="flex space-x-2 rtl:space-x-reverse items-center">
                        <Link
                          to={`/products/${item.id}`}
                          onClick={handleClose}
                          className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                          aria-label={`Open ${item.name}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/products/${item.id}`}
                          onClick={handleClose}
                          className="btn btn-ghost btn-sm p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                          aria-label={`View ${item.name}`}
                        >
                          {locale === 'ar' ? 'عرض' : 'View'}
                        </Link>
                        <button
                          onClick={() => handleRemoveFromFavorites(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'user':
        return (
          <div className="flex flex-col h-full">
            {/* رأس حساب المستخدم */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.user.title}
                </h2>
              </div>
            </div>

            {/* معلومات المستخدم */}
            {user && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <img
                    src={user.avatar || '/placeholder-avatar.png'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-avatar.png';
                    }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* روابط الحساب */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {userLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={handleClose}
                      className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.name}</span>
                      <ChevronLeft className="w-4 h-4 ml-auto rtl:hidden" />
                      <ChevronRight className="w-4 h-4 ml-auto ltr:hidden" />
                    </Link>
                  );
                })}
              </div>

              {/* زر تسجيل الخروج */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center space-x-3 rtl:space-x-reverse w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>{t.user.logout}</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'menu':
      default:
        return (
          <div className="flex flex-col h-full">
            {/* رأس القائمة */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.menu.title}
              </h2>
            </div>

            {/* روابط القائمة */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {menuLinks.map((link) => {
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={handleClose}
                      className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span>{link.name}</span>
                      <ChevronLeft className="w-4 h-4 ml-auto rtl:hidden" />
                      <ChevronRight className="w-4 h-4 ml-auto ltr:hidden" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
    }
  };

  // إذا لم يكن الشريط الجانبي مفتوحاً، لا نعرض شيئاً
  if (!isOpen) return null;

  return (
    <>
      {/* الخلفية */}
      {showOverlay && (
        <AnimatePresence>
          <motion.div
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />
        </AnimatePresence>
      )}

      {/* الشريط الجانبي */}
      <AnimatePresence>
        <motion.div
          ref={sidebarRef}
          className={`fixed top-0 ${getPositionClasses()} ${getSizeClasses()} h-full bg-white dark:bg-gray-900 shadow-xl z-50 ${className}`}
          initial={{ x: position === 'right' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: position === 'right' ? '100%' : '-100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default Sidebar;