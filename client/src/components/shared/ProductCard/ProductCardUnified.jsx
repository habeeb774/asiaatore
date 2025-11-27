import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useCart } from '../../../contexts/CartContext';
import { useSettings } from '../../../contexts/SettingsContext';
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

const VARIANT_CLASS_MAP = {
  default: 'grid',
  grid: 'grid',
  featured: 'featured',
  compact: 'compact',
  list: 'list'
};

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
  const settingsCtx = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedVariant = VARIANT_CLASS_MAP[variant] || 'grid';
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), [locale]);
  const formatCurrency = useCallback((value) => {
    const safeNumber = Math.max(0, Number(value) || 0);
    return currencyFormatter.format(safeNumber);
  }, [currencyFormatter]);

  const fallbackImage = useMemo(() => {
    const logoCandidate = settingsCtx?.setting?.logoUrl ?? settingsCtx?.setting?.logo;

    const pickString = (value) => {
      if (typeof value === 'string' && value.trim()) return value;
      if (value && typeof value === 'object') {
        const localized = value[locale] || value.en;
        if (typeof localized === 'string' && localized.trim()) return localized;
        const firstString = Object.values(value).find((entry) => typeof entry === 'string' && entry.trim());
        if (firstString) return firstString;
      }
      return null;
    };

    const resolved = pickString(logoCandidate);
    return resolved || '/images/site-logo.svg';
  }, [settingsCtx?.setting, locale]);

  // حالات المكون
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const check = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    } catch {}
  }, []);

  // بيانات المنتج المعالجة
  const processedProduct = useMemo(() => {
    if (!product) return null;

    const images = (() => {
      const list = [];

      if (Array.isArray(product.images)) {
        product.images.forEach((img) => {
          if (!img) return;
          if (typeof img === 'string' && img.trim()) {
            list.push(img);
            return;
          }
          if (typeof img === 'object') {
            const localized = img[locale] || img.en;
            if (typeof localized === 'string' && localized.trim()) {
              list.push(localized);
              return;
            }
            const fallback = Object.values(img).find((entry) => typeof entry === 'string' && entry.trim());
            if (fallback) list.push(fallback);
          }
        });
      }

      const additionalImageFields = [
        product.image,
        product.coverImage,
        product.thumbnail,
        product.displayImage
      ];

      additionalImageFields.forEach((img) => {
        if (!img) return;
        if (typeof img === 'string' && img.trim()) {
          list.push(img);
          return;
        }
        if (typeof img === 'object') {
          const localized = img[locale] || img.en;
          if (typeof localized === 'string' && localized.trim()) {
            list.push(localized);
            return;
          }
          const fallback = Object.values(img).find((entry) => typeof entry === 'string' && entry.trim());
          if (fallback) list.push(fallback);
        }
      });

      return list.length > 0 ? Array.from(new Set(list)) : [fallbackImage];
    })();
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
  }, [product, fallbackImage, locale]);

  const productHighlights = useMemo(() => {
    if (!processedProduct) return [];

    const highlights = [];

    if (processedProduct.hasDiscount && processedProduct.savings > 0) {
      highlights.push({
        key: 'savings',
        text: locale === 'ar'
          ? `وفرت ${formatCurrency(processedProduct.savings)}`
          : `Saved ${formatCurrency(processedProduct.savings)}`,
        tone: 'savings'
      });
    }

    if (processedProduct.isOutOfStock) {
      highlights.push({
        key: 'out-of-stock',
        text: locale === 'ar' ? 'غير متاح مؤقتاً' : 'Temporarily unavailable',
        tone: 'danger'
      });
    } else if (processedProduct.stock <= 3) {
      highlights.push({
        key: 'low-stock',
        text: locale === 'ar'
          ? `كمية محدودة (${processedProduct.stock})`
          : `Limited stock (${processedProduct.stock})`,
        tone: 'warning'
      });
    } else {
      highlights.push({
        key: 'dispatch',
        text: locale === 'ar' ? 'شحن فوري' : 'Express dispatch',
        tone: 'success'
      });
    }

    if (processedProduct.rating >= 4 && processedProduct.reviews > 0) {
      highlights.push({
        key: 'rating',
        text: locale === 'ar' ? 'الأكثر تقييماً' : 'Client favourite',
        tone: 'accent'
      });
    }

    return highlights.slice(0, 3);
  }, [formatCurrency, locale, processedProduct]);

  const cardBaseClasses = useMemo(() => {
    const classes = [
      'product-card',
      `product-card--${normalizedVariant}`,
      'group',
      'product-card--elevated'
    ];

    if (processedProduct?.isOutOfStock) {
      classes.push('is-out-of-stock');
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ').trim();
  }, [className, normalizedVariant, processedProduct?.isOutOfStock]);

  // عنصر العربة الحالي
  const cartItem = useMemo(() =>
    cartItems?.find(item => item.id === product?.id),
    [cartItems, product?.id]
  );

  const currentQty = cartItem?.quantity || 0;

  // تدوير الصور تلقائياً عند التمرير
  useEffect(() => {
    if (!isHovered || !processedProduct?.hasMultipleImages || normalizedVariant !== 'featured') return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % processedProduct.images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, processedProduct, normalizedVariant]);

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

  const handleTiltMove = useCallback((e) => {
    try {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = x / rect.width;
      const ny = y / rect.height;
      const rx = (0.5 - ny) * 6;
      const ry = (nx - 0.5) * 6;
      el.style.setProperty('--tilt-x', rx.toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', ry.toFixed(2) + 'deg');
      el.style.setProperty('--tilt-scale', '1.03');
    } catch {}
  }, []);

  const handleTiltLeave = useCallback((e) => {
    try {
      const el = e.currentTarget;
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-scale', '1');
    } catch {}
  }, []);

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
            className="z-20"
          >
            <span className="discount-badge">
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

  const ProductHighlights = memo(() => {
    if (!productHighlights.length) return null;

    return (
      <div className="product-highlights">
        {productHighlights.map((highlight) => (
          <span
            key={highlight.key}
            className={`highlight-chip highlight-chip--${highlight.tone}`}
          >
            {highlight.text}
          </span>
        ))}
      </div>
    );
  });

  // مكون السعر
  const PriceDisplay = memo(() => (
    <div className="product-price-display">
      <motion.span
        layout
        className="price-primary"
      >
        {formatCurrency(processedProduct.price)}
      </motion.span>

      {processedProduct.hasDiscount && (
        <motion.span
          layout
          className="price-old"
        >
          {formatCurrency(processedProduct.oldPrice)}
        </motion.span>
      )}

      {processedProduct.hasDiscount && processedProduct.savings > 0 && (
        <motion.span
          layout
          className="price-savings"
        >
          {locale === 'ar'
            ? `وفرت ${formatCurrency(processedProduct.savings)}`
            : `Saved ${formatCurrency(processedProduct.savings)}`}
        </motion.span>
      )}
    </div>
  ));

  // مكون زر إضافة إلى العربة
  const AddToCartButton = memo(() => {
    if (!showAddToCart) return null;

    const isAtMax = currentQty >= (maxPerItem || 10);
    const canAddMore = !processedProduct.isOutOfStock && !isAtMax;
    if (currentQty > 0) {
      return (
        <div className="flex items-center rounded-2xl border border-slate-200/60 bg-white/80 p-1 shadow-inner backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <button
            onClick={() => handleUpdateQuantity(currentQty - 1)}
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
            disabled={currentQty <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-sm font-medium min-w-[3rem] text-center">
            {currentQty}
          </span>
          <button
            onClick={() => handleUpdateQuantity(currentQty + 1)}
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
            disabled={!canAddMore}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: canAddMore ? 1.03 : 1 }}
        whileTap={{ scale: canAddMore ? 0.97 : 1 }}
        onClick={handleAddToCart}
        disabled={!canAddMore || isAddingToCart}
        className={`add-to-cart-btn add-to-cart-btn--luxury ${(!canAddMore || isAddingToCart) ? 'is-disabled' : ''}`}
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
    );
  });

  // مكون التراكب التفاعلي
  const InteractiveOverlay = memo(() => (
    <AnimatePresence>
      {(isHovered || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="product-overlay absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] backdrop-blur-sm"
        >
          <div className="flex space-x-3 rtl:space-x-reverse">
            {showQuickView && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickView}
                className="quick-view-btn bg-white/95 backdrop-blur-sm text-gray-900 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
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
    switch (normalizedVariant) {
      case 'compact':
        return (
          <motion.div
            className={cardBaseClasses}
            whileHover={{ y: -2 }}
          >
            <div className="product-image" onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
              <LazyImage
                src={processedProduct.images[currentImageIndex] || fallbackImage}
                alt={processedProduct.name}
                className="w-full h-full object-cover"
                width={96}
                height={96}
              />
              <ProductBadges />
            </div>

            <div className="product-info">
              <h3 className="product-name text-sm line-clamp-2">
                {processedProduct.name}
              </h3>

              <ProductHighlights />

              <div className="product-footer">
                <div className="price">
                  <PriceDisplay />
                </div>
                <AddToCartButton />
              </div>
            </div>
          </motion.div>
        );

      case 'list':
        return (
          <motion.div
            className={cardBaseClasses}
            whileHover={{ y: -2 }}
          >
            <div className="product-image" onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
              <LazyImage
                src={processedProduct.images[currentImageIndex] || fallbackImage}
                alt={processedProduct.name}
                className="w-full h-full object-cover"
                width={128}
                height={128}
              />
              <ProductBadges />
            </div>

            <div className="product-info">
              <div className="flex justify-between items-start mb-2">
                <h3 className="product-name font-semibold text-gray-900 dark:text-white text-lg">
                  {processedProduct.name}
                </h3>
                {showRating && <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} />}
              </div>

              <ProductHighlights />

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {processedProduct.description}
              </p>

              <div className="product-footer">
                <div className="price">
                  <PriceDisplay />
                </div>
                <AddToCartButton />
              </div>
            </div>
          </motion.div>
        );

      case 'featured':
        return (
          <motion.div
            className={cardBaseClasses}
            whileHover={{ y: -4, scale: 1.02 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="product-image" onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
              <LazyImage
                src={processedProduct.images[currentImageIndex] || fallbackImage}
                alt={`${processedProduct.name}`}
                width={400}
                height={400}
                priority={priority}
              />

              <ProductBadges />
              <InteractiveOverlay />

              {processedProduct.hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
                  {processedProduct.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`rounded-full transition-all ${
                        index === currentImageIndex ? 'w-3 h-3 bg-white shadow ring-1 ring-white/60' : 'w-3 h-3 bg-white/60 ring-1 ring-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              <h3 className="product-name font-bold text-gray-900 dark:text-white text-xl line-clamp-2">
                {processedProduct.name}
              </h3>

              {showRating && (
                <div>
                  <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} size="md" />
                </div>
              )}

              <ProductHighlights />

              {processedProduct.description && (
                <p className="product-description line-clamp-3">
                  {processedProduct.description}
                </p>
              )}

              <div className="product-footer">
                <div className="price">
                  <PriceDisplay />
                </div>
                <AddToCartButton />
              </div>
            </div>
          </motion.div>
        );

      case 'grid':
      default:
        return (
          <motion.div
            className={cardBaseClasses}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -4 }}
          >
            <div className="product-image" onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
              <LazyImage
                src={processedProduct.images[currentImageIndex] || fallbackImage}
                alt={processedProduct.name}
                className="w-full h-full object-cover"
                width={300}
                height={300}
                priority={priority}
              />

              <ProductBadges />
              <InteractiveOverlay />
            </div>

            <div className="product-info">
              <h3 className="product-name font-medium text-gray-900 dark:text-white text-base line-clamp-2">
                {processedProduct.name}
              </h3>

              {showRating && (
                <div>
                  <RatingStars rating={processedProduct.rating} reviews={processedProduct.reviews} />
                </div>
              )}

              <ProductHighlights />

              <div className="product-footer">
                <div className="price">
                  <PriceDisplay />
                </div>
                <AddToCartButton />
              </div>
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
