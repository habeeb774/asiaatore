import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../../stores/LanguageContext';
import { useCart } from '../../../stores/CartContext';
import LazyImage from '../LazyImage/LazyImage';
import { SkeletonLoader } from '../SkeletonLoader/SkeletonLoader';
import { AnimatePresence, motion } from '../../../lib/framerLazy';

import {
  Heart,
  ShoppingCart,
  Eye,
  Star,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';

/**
 * مكون ProductCard الموحد - يجمع أفضل الميزات من جميع مكونات ProductCard المختلفة
 *
 * الميزات المدعومة:
 * - أنواع متعددة من البطاقات (افتراضي، مصغر، مميز، شبكة، قائمة)
 * - عرض سريع للمنتج
 * - إدارة العربة مع الكميات
 * - المفضلة والتقييمات
 * - تأثيرات بصرية متقدمة
 * - دعم اللغات المتعددة
 * - وضع ملء الشاشة الاختياري
 * - دعم الوضع المظلم
 * - تحسينات الأداء
 */
const ProductCard = ({
  product,
  variant = 'default', // default, compact, featured, grid, list
  showQuickView = true,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  showBadges = true,
  priority = false,
  className = '',
  onQuickView,
  onAddToWishlist,
  onRemoveFromWishlist
}) => {
  const { locale } = useLanguage();
  const { addToCart, updateQuantity, cartItems, maxPerItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // حالات المكون
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // بيانات المنتج المعالجة
  const processedProduct = useMemo(() => {
    if (!product) return null;

    const images = product.images || [product.image] || [];
    const rawName = product.name || product.title || '';
    // Handle multilingual names
    const name = typeof rawName === 'object' && rawName[locale]
      ? rawName[locale]
      : typeof rawName === 'string'
      ? rawName
      : '';
    const rawDescription = product.description || product.shortDescription || '';
    // Handle multilingual descriptions
    const description = typeof rawDescription === 'object' && rawDescription[locale]
      ? rawDescription[locale]
      : typeof rawDescription === 'string'
      ? rawDescription
      : '';
    const price = product.price || 0;
    const oldPrice = product.oldPrice || product.originalPrice;
    const rating = product.rating || 0;
    const reviews = product.reviews || 0;
    const stock = product.stock !== undefined ? product.stock : 10;
    const isOutOfStock = stock <= 0;
    const hasDiscount = oldPrice && oldPrice > price;
    const discountPercent = hasDiscount ? Math.round((1 - (price / oldPrice)) * 100) : 0;
    const savings = hasDiscount ? oldPrice - price : 0;

    return {
      ...product,
      images,
      name,
      description,
      price,
      oldPrice,
      rating,
      reviews,
      stock,
      isOutOfStock,
      hasDiscount,
      discountPercent,
      savings,
      hasMultipleImages: images.length > 1
    };
  }, [product]);

  // عنصر العربة الحالي
  const cartItem = useMemo(() =>
    cartItems?.find(item => item.id === product?.id),
    [cartItems, product?.id]
  );

  const currentQty = cartItem?.quantity || 0;

  // تدوير الصور تلقائياً عند التمرير
  useEffect(() => {
    if (!isHovered || !processedProduct?.hasMultipleImages || variant !== 'featured') return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % processedProduct.images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, processedProduct, variant]);

  // معالج إضافة إلى العربة
  const handleAddToCart = useCallback(async () => {
    if (processedProduct.isOutOfStock) return;

    setIsAddingToCart(true);
    try {
      const result = addToCart(processedProduct, 1);

      if (result?.reason === 'AUTH_REQUIRED') {
        const from = location.pathname + (location.search || '');
        navigate('/login', { state: { from } });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [processedProduct, addToCart, navigate, location]);

  // معالج تحديث الكمية
  const handleUpdateQuantity = useCallback((newQuantity) => {
    if (newQuantity <= 0) {
      updateQuantity(processedProduct.id, 0);
    } else if (newQuantity <= (maxPerItem || 10)) {
      updateQuantity(processedProduct.id, newQuantity);
    }
  }, [processedProduct.id, updateQuantity, maxPerItem]);

  // معالج العرض السريع
  const handleQuickView = useCallback(() => {
    if (onQuickView) {
      onQuickView(processedProduct);
    }
  }, [processedProduct, onQuickView]);

  // معالج المفضلة
  const handleWishlist = useCallback(() => {
    if (onAddToWishlist && !isWishlisted) {
      onAddToWishlist(processedProduct);
      setIsWishlisted(true);
    } else if (onRemoveFromWishlist && isWishlisted) {
      onRemoveFromWishlist(processedProduct.id);
      setIsWishlisted(false);
    }
  }, [processedProduct, isWishlisted, onAddToWishlist, onRemoveFromWishlist]);

  // إذا لم يكن هناك منتج، لا نعرض شيئاً
  if (!processedProduct) {
    return null;
  }

  // مكون النجوم
  const RatingStars = memo(({ rating, reviews, size = 'sm' }) => {
    if (!rating) return null;

    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`${starSize} ${
                i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        {reviews > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({reviews})
          </span>
        )}
      </div>
    );
  });

  // مكون الشارات
  const ProductBadges = memo(() => {
    if (!showBadges) return null;

    return (
      <>
        {/* خصم */}
        {processedProduct.hasDiscount && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 z-20"
          >
            <span className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              -{processedProduct.discountPercent}%
            </span>
          </motion.div>
        )}

        {/* جديد */}
        {processedProduct.badge === 'new' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-3 right-3 z-20"
          >
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              {locale === 'ar' ? 'جديد' : 'NEW'}
            </span>
          </motion.div>
        )}

        {/* نفد من المخزون */}
        {processedProduct.isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg">
            <span className="bg-red-600 text-white text-lg font-bold px-6 py-3 rounded-full shadow-lg">
              {locale === 'ar' ? 'نفد من المخزون' : 'OUT OF STOCK'}
            </span>
          </div>
        )}
      </>
    );
  });

  // مكون السعر
  const PriceDisplay = memo(() => (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {processedProduct.price} {locale === 'ar' ? 'ر.س' : 'SAR'}
      </span>

      {processedProduct.hasDiscount && (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
            {processedProduct.oldPrice} {locale === 'ar' ? 'ر.س' : 'SAR'}
          </span>
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {locale === 'ar' ? `وفرت ${processedProduct.savings} ر.س` : `Save ${processedProduct.savings} SAR`}
          </span>
        </>
      )}
    </div>
  ));

  // مكون زر إضافة إلى العربة
  const AddToCartButton = memo(() => {
    if (!showAddToCart) return null;

    const isAtMax = currentQty >= (maxPerItem || 10);
    const canAddMore = !processedProduct.isOutOfStock && !isAtMax;

    return (
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        {currentQty > 0 ? (
          // أدوات التحكم في الكمية
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleUpdateQuantity(currentQty - 1)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={currentQty <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm font-medium min-w-[3rem] text-center">
              {currentQty}
            </span>
            <button
              onClick={() => handleUpdateQuantity(currentQty + 1)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={!canAddMore}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // زر إضافة إلى العربة
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={!canAddMore || isAddingToCart}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              canAddMore
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{locale === 'ar' ? 'جاري الإضافة...' : 'Adding...'}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {processedProduct.isOutOfStock
                    ? (locale === 'ar' ? 'غير متوفر' : 'Out of Stock')
                    : isAtMax
                    ? (locale === 'ar' ? 'الحد الأقصى' : 'Max Reached')
                    : (locale === 'ar' ? 'إضافة للعربة' : 'Add to Cart')
                  }
                </span>
              </>
            )}
          </motion.button>
        )}
      </div>
    );
  });

  // مكون التراكب التفاعلي
  const InteractiveOverlay = memo(() => (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <div className="flex space-x-3 rtl:space-x-reverse">
            {showQuickView && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickView}
                className="bg-white/95 backdrop-blur-sm text-gray-900 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                aria-label={locale === 'ar' ? 'عرض سريع' : 'Quick View'}
              >
                <Eye className="w-5 h-5" />
              </motion.button>
            )}

            {showWishlist && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleWishlist}
                className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                  isWishlisted
                    ? 'bg-red-500 text-white'
                    : 'bg-white/95 backdrop-blur-sm text-gray-900'
                }`}
                aria-label={locale === 'ar' ? 'المفضلة' : 'Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ));

  // تصيير حسب النوع
  const renderCard = () => {
    const baseClasses = `relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 ${className}`;

    switch (variant) {
      case 'compact':
        return (
          <motion.div
            className={`${baseClasses} flex`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -2 }}
          >
            <div className="w-24 h-24 flex-shrink-0">
              <LazyImage
                src={processedProduct.images[currentImageIndex] || '/placeholder-product.png'}
                alt={processedProduct.name}
                className="w-full h-full object-cover"
                width={96}
                height={96}
              />
            </div>

            <div className="flex-1 p-3">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                {processedProduct.name}
              </h3>
              <PriceDisplay />
              <div className="mt-2">
                <AddToCartButton />
              </div>
            </div>
          </motion.div>
        );

      case 'list':
        return (
          <motion.div
            className={`${baseClasses} flex`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -2 }}
          >
            <div className="w-32 h-32 flex-shrink-0">
              <LazyImage
                src={processedProduct.images[currentImageIndex] || '/placeholder-product.png'}
                alt={processedProduct.name}
                className="w-full h-full object-cover rounded-l-lg"
                width={128}
                height={128}
              />
            </div>

            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {processedProduct.name}
                </h3>
                {showRating && <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} />}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {processedProduct.description}
              </p>

              <div className="flex justify-between items-center">
                <PriceDisplay />
                <AddToCartButton />
              </div>
            </div>
          </motion.div>
        );

      case 'featured':
        return (
          <motion.div
            className={`${baseClasses} group`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="relative h-[150px] overflow-hidden">
              <LazyImage
                src={processedProduct.images[currentImageIndex] || '/placeholder-product.png'}
                alt={processedProduct.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                width={400}
                height={400}
                priority={priority}
              />

              <ProductBadges />
              <InteractiveOverlay />

              {/* مؤشر الصور المتعددة */}
              {processedProduct.hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 rtl:space-x-reverse">
                  {processedProduct.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 line-clamp-2">
                {processedProduct.name}
              </h3>

              {showRating && (
                <div className="mb-3">
                  <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} size="md" />
                </div>
              )}

              <div className="mb-4">
                <PriceDisplay />
              </div>

              <AddToCartButton />
            </div>
          </motion.div>
        );

      case 'grid':
      default:
        return (
          <motion.div
            className={`${baseClasses} group`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-[200px] overflow-hidden">
              <LazyImage
                src={processedProduct.images[currentImageIndex] || '/placeholder-product.png'}
                alt={processedProduct.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                width={300}
                height={300}
                priority={priority}
              />

              <ProductBadges />
              <InteractiveOverlay />
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-base mb-2 line-clamp-2">
                {processedProduct.name}
              </h3>

              {showRating && (
                <div className="mb-2">
                  <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} />
                </div>
              )}

              <div className="mb-3">
                <PriceDisplay />
              </div>

              <AddToCartButton />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Link
      to={`/product/${processedProduct.id}`}
      className="block"
      onClick={(e) => {
        // منع التنقل عند النقر على الأزرار التفاعلية
        if (e.target.closest('button')) {
          e.preventDefault();
        }
      }}
    >
      {renderCard()}
    </Link>
  );
};

// مكون الهيكل العظمي للتحميل
export const ProductCardSkeleton = ({ variant = 'default' }) => {
  const baseClasses = "bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse";

  switch (variant) {
    case 'compact':
      return (
        <div className={`${baseClasses} flex`}>
          <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
          <div className="flex-1 p-3 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          </div>
        </div>
      );

    case 'list':
      return (
        <div className={`${baseClasses} flex`}>
          <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 flex-shrink-0 rounded-l-lg"></div>
          <div className="flex-1 p-4 space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClasses}>
          <div className="h-[200px] bg-gray-300 dark:bg-gray-600"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      );
  }
};

// مكون شبكة المنتجات
export const ProductCardGrid = ({
  children,
  columns = { default: 1, md: 2, lg: 3, xl: 4 },
  gap = 6
}) => (
  <div
    className={`grid gap-${gap}`}
    style={{
      gridTemplateColumns: `repeat(${columns.default}, minmax(0, 1fr))`
    }}
  >
    {children}
  </div>
);

export default memo(ProductCard);