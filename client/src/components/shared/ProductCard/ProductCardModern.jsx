import React, { useState, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useCart } from '../../../contexts/CartContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import LazyImage from '../LazyImage/LazyImage';
import { motion } from '../../../lib/framerLazy';

import {
  Heart,
  ShoppingCart,
  Eye,
  Star,
  Plus,
  Check,
  Sparkles,
  Truck,
  Shield,
  Clock
} from 'lucide-react';

/**
 * ProductCardModern - بطاقة منتج حديثة ومحسّنة
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - دعم كامل للـ RTL
 * - إشعارات تفاعلية
 * - عرض سريع للمنتج
 * - إدارة العربة والمفضلة
 * - أداء محسّن مع memo
 */
const ProductCardModern = memo(({
  product,
  variant = 'default',
  className = '',
  showQuickView = true,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  priority = false,
  onQuickView
}) => {
  const { locale, t } = useLanguage();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { setting } = useSettings();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  const isRTL = locale === 'ar';
  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  
  // تنسيق العملة
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price || 0);
  }, [isRTL]);
  
  // حساب نسبة الخصم
  const discountPercentage = useMemo(() => {
    if (!product.is_on_sale || !product.regular_price || !product.sale_price) return 0;
    const regular = Number(product.regular_price);
    const sale = Number(product.sale_price);
    return Math.round(((regular - sale) / regular) * 100);
  }, [product]);
  
  // معالجة إضافة للعربة
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding || inCart) return;
    
    setIsAdding(true);
    try {
      await addToCart(product);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  }, [product, addToCart, isAdding, inCart]);
  
  // معالجة المفضلة
  const handleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    }
  }, [product, inWishlist, addToWishlist, removeFromWishlist]);
  
  // معالجة العرض السريع
  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  }, [product, onQuickView]);
  
  // صورة المنتج
  const productImage = product.image || product.thumbnail || setting?.logo || '/images/placeholder.jpg';
  
  // فئات CSS حسب النوع
  const cardClasses = useMemo(() => {
    const base = 'group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100';
    const variants = {
      default: 'aspect-[3/4]',
      compact: 'aspect-square',
      featured: 'aspect-[4/3] lg:aspect-[16/9]',
      list: 'aspect-auto flex-row'
    };
    return `${base} ${variants[variant] || variants.default} ${className}`;
  }, [variant, className]);
  
  const contentClasses = variant === 'list' 
    ? 'flex gap-4 p-4 w-full'
    : 'p-4 h-full flex flex-col';
  
  return (
    <motion.div
      className={cardClasses}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      {/* صورة المنتج */}
      <div className={variant === 'list' ? 'w-32 h-32 flex-shrink-0' : 'relative h-48 overflow-hidden'}>
        <LazyImage
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        
        {/* شارات الخصم */}
        {discountPercentage > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold"
          >
            -{discountPercentage}%
          </motion.div>
        )}
        
        {/* شارات الحالة */}
        {product.is_new && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {t('new')}
          </div>
        )}
        
        {product.is_out_of_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold">{t('out_of_stock')}</span>
          </div>
        )}
        
        {/* أزرار التفاعل */}
        {isHovered && !product.is_out_of_stock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
          >
            {showQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                aria-label={t('quick_view')}
              >
                <Eye size={18} />
              </button>
            )}
            {showWishlist && (
              <button
                onClick={handleWishlist}
                className={`p-2 rounded-full transition-colors ${
                  inWishlist 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white hover:bg-gray-100'
                }`}
                aria-label={t('wishlist')}
              >
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            )}
          </motion.div>
        )}
      </div>
      
      {/* محتوى المنتج */}
      <div className={contentClasses}>
        <div className="flex-1 min-w-0">
          {/* اسم المنتج */}
          <Link 
            to={`/products/${product.id}`}
            className={`block ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          
          {/* التقييم */}
          {showRating && product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews_count || 0})
              </span>
            </div>
          )}
          
          {/* الوصف */}
          {product.short_description && variant !== 'compact' && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.short_description}
            </p>
          )}
          
          {/* المميزات */}
          {variant === 'featured' && (
            <div className="flex flex-wrap gap-2 mb-3">
              {product.free_shipping && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Truck size={12} />
                  {t('free_shipping')}
                </span>
              )}
              {product.warranty && (
                <span className="flex items-center gap-1 text-xs text-blue-600">
                  <Shield size={12} />
                  {t('warranty')}
                </span>
              )}
              {product.fast_delivery && (
                <span className="flex items-center gap-1 text-xs text-purple-600">
                  <Clock size={12} />
                  {t('fast_delivery')}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* السعر والزر */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div className={isRTL ? 'text-left' : 'text-right'}>
              {product.is_on_sale ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-500">
                    {formatPrice(product.sale_price)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price || product.regular_price)}
                </span>
              )}
            </div>
          </div>
          
          {showAddToCart && !product.is_out_of_stock && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || inCart}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                inCart
                  ? 'bg-green-500 text-white'
                  : isAdding
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('adding')}
                </span>
              ) : inCart ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} />
                  {t('in_cart')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  {t('add_to_cart')}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* إشعار الإضافة للعربة */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10"
          >
            <span className="flex items-center justify-center gap-2">
              <Check size={16} />
              {t('added_to_cart')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ProductCardModern.displayName = 'ProductCardModern';

export default ProductCardModern;
