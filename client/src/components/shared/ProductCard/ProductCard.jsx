import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import { useCart } from '../../../stores/CartContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import QuickViewModal from '../../products/QuickViewModal';
import LazyImage from '../../common/LazyImage';
import { resolveLocalized } from '../../../utils/locale';

// مكونات فرعية محسنة للأداء
const ProductBadges = memo(({ 
  product, 
  hasDiscount, 
  discountPercent, 
  outOfStock, 
  showImageBadge, 
  locale 
}) => {
  return (
    <>
      {/* Enhanced Sale ribbon with animation */}
      {hasDiscount && typeof discountPercent === 'number' && (
        <div className="absolute top-3 left-3 z-20 animate-bounce">
          <span
            className="inline-block bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg transform -rotate-12 hover:rotate-0 transition-transform duration-300 border-2 border-white"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              {locale === 'ar' ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
            </span>
          </span>
        </div>
      )}
      
      {/* New product badge */}
      {product.badge && (
        <div className="absolute top-3 right-3 z-20">
          <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
            {locale === 'ar' ? 'جديد' : 'NEW'}
          </span>
        </div>
      )}
      
      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <span className="bg-red-600 text-white text-lg font-bold px-6 py-3 rounded-full shadow-lg transform rotate-12">
            {locale === 'ar' ? 'نفد من المخزون' : 'OUT OF STOCK'}
          </span>
        </div>
      )}
      
      {/* Quality badge for high-rated products */}
      {product.rating >= 4.8 && (
        <div className="absolute bottom-3 left-3 z-20">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {locale === 'ar' ? 'جودة عالية' : 'PREMIUM'}
          </span>
        </div>
      )}
    </>
  );
});

const RatingStars = memo(({ rating }) => {
  if (!rating) return null;
  
  return (
    <div className="rating-row" aria-label={`rating ${rating}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span 
          key={i} 
          className={`star ${i <= rating ? '' : 'off'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
});

const PriceDisplay = memo(({ 
  price, 
  baseOld, 
  hasDiscount, 
  discountPercent, 
  savings, 
  showPriceBadge, 
  locale 
}) => {
  return (
    <div className="price-row">
      <span className="price">
        {price} {locale === 'ar' ? 'ر.س' : 'SAR'}
      </span>
      
      {Number.isFinite(baseOld) && (
        <span className="old">{baseOld}</span>
      )}
      
      {showPriceBadge && hasDiscount && typeof discountPercent === 'number' && (
        <span 
          className="badge-soft" 
          style={{
            fontSize: '.62rem', 
            padding: '.15rem .4rem', 
            borderRadius: 8, 
            marginInlineStart: 6
          }}
        >
          -{discountPercent}%
        </span>
      )}
      
      {hasDiscount && savings > 0 && (
        <span 
          className="save-badge" 
          aria-label={locale === 'ar' ? `وفرت ${savings} ر.س` : `Saved ${savings} SAR`}
        >
          {locale === 'ar' ? `وفّرت ${savings} ر.س` : `Saved ${savings} SAR`}
        </span>
      )}
    </div>
  );
});

const AddToCartButton = memo(({ 
  product, 
  currentQty, 
  maxPerItem, 
  outOfStock, 
  locale, 
  t, 
  onAddToCart 
}) => {
  const [btnState, setBtnState] = useState('idle');
  const reachedMax = currentQty >= (maxPerItem || 10);
  
  // تحديث حالة الزر عند تغيير الكمية
  useEffect(() => {
    if (reachedMax) {
      setBtnState('max');
    } else if (btnState === 'max') {
      setBtnState('idle');
    }
  }, [reachedMax]);
  
  const handleClick = useCallback(() => {
    if (outOfStock || reachedMax) return;
    
    const result = onAddToCart(product, 1);
    if (result?.ok) {
      const willMax = (currentQty + 1) >= (maxPerItem || 10);
      setBtnState(willMax ? 'max' : 'added');
      
      const timer = setTimeout(() => {
        setBtnState(willMax ? 'max' : 'idle');
      }, 1400);
      
      return () => clearTimeout(timer);
    }
    
    return result;
  }, [product, currentQty, maxPerItem, outOfStock, onAddToCart]);
  
  const getButtonText = useCallback(() => {
    if (outOfStock) {
      return locale === 'ar' ? 'غير متوفر' : 'Out of stock';
    }
    if (reachedMax) {
      return locale === 'ar' ? 'الحد الأقصى' : 'Max';
    }
    if (btnState === 'added') {
      return locale === 'ar' ? '✓ تمت الإضافة' : '✓ Added';
    }
    return t('addToCart');
  }, [outOfStock, currentQty, maxPerItem, btnState, locale, t]);
  
  const getAriaLabel = useCallback(() => {
    if (outOfStock) {
      return locale === 'ar' ? 'غير متوفر' : 'Out of stock';
    }
    if (reachedMax) {
      return locale === 'ar' ? 'الحد الأقصى' : 'Max reached';
    }
    return t('addToCart');
  }, [outOfStock, currentQty, maxPerItem, locale, t]);
  
  return (
    <button
      className={`primary ${btnState === 'added' ? 'added' : ''} ${btnState === 'max' ? 'at-max' : ''}`}
      disabled={outOfStock || reachedMax}
      onClick={handleClick}
      aria-label={getAriaLabel()}
    >
      {getButtonText()}
    </button>
  );
});

// المكون الرئيسي المحسن
const ProductCard = ({ 
  product, 
  showImageBadge = true, 
  showPriceBadge = true, 
  priority = false 
}) => {
  const { locale, t } = useLanguage();
  const { addToCart, cartItems, maxPerItem } = useCart() || { 
    addToCart: () => ({}), 
    cartItems: [], 
    maxPerItem: 10 
  };
  
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  
  // استخدام useMemo للبيانات المشتقة
  const name = useMemo(() => 
    resolveLocalized(product?.name ?? product?.title, locale) || 
    (typeof product?.name === 'string' ? product.name : product?.title) || '',
    [product, locale]
  );
  
  const detailsPath = useMemo(() => 
    `${locale === 'ar' ? '' : '/' + locale}/product/${product.id}`,
    [locale, product.id]
  );
  
  // حساب الخصومات والأسعار
  const { baseOld, hasDiscount, discountPercent, savings, outOfStock } = useMemo(() => {
    const baseOldRaw = (product?.oldPrice ?? product?.originalPrice);
    const baseOld = baseOldRaw != null ? +baseOldRaw : undefined;
    const priceNum = product?.price != null ? +product.price : undefined;
    const hasDiscount = Number.isFinite(baseOld) && Number.isFinite(priceNum) && baseOld > priceNum;
    const discountPercent = hasDiscount ? Math.round((1 - (priceNum / baseOld)) * 100) : null;
    const savings = hasDiscount ? Math.max(0, baseOld - priceNum) : 0;
    const outOfStock = product.stock !== undefined && product.stock <= 0;
    
    return { baseOld, priceNum, hasDiscount, discountPercent, savings, outOfStock };
  }, [product]);
  
  // البحث عن المنتج في السلة
  const currentItem = useMemo(() => 
    cartItems?.find(i => i.id === product.id),
    [cartItems, product.id]
  );
  
  const currentQty = currentItem?.quantity || 0;
  
  // معالج إضافة إلى السلة
  const handleAddToCart = useCallback((product, quantity) => {
    const result = addToCart(product, quantity);
    
    if (result?.reason === 'AUTH_REQUIRED') {
      const from = location.pathname + (location.search || '');
      navigate('/login', { state: { from } });
    }
    
    return result;
  }, [addToCart, navigate, location.pathname, location.search]);
  
  // معالج العرض السريع
  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);
  
  // مصادر الصور المحسنة
  const imageSources = useMemo(() => {
    return ({
    avifSrcSet: product.imageVariants?.avif ? [
      product.imageVariants.avif.thumb && `${product.imageVariants.avif.thumb} 200w`,
      product.imageVariants.avif.medium && `${product.imageVariants.avif.medium} 400w`,
      product.imageVariants.avif.large && `${product.imageVariants.avif.large} 800w`
    ].filter(Boolean).join(', ') : undefined,
    
    webpSrcSet: product.imageVariants?.webp ? [
      product.imageVariants.webp.thumb && `${product.imageVariants.webp.thumb} 200w`,
      product.imageVariants.webp.medium && `${product.imageVariants.webp.medium} 400w`,
      product.imageVariants.webp.large && `${product.imageVariants.webp.large} 800w`
    ].filter(Boolean).join(', ') : undefined
  })}, [product.imageVariants]);
  
  return (
    <div className="product-card group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1" data-id={product.id}>
      <Link to={detailsPath} className="product-image product-media block relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 aspect-square overflow-hidden" aria-label={name}>
        <div className="relative w-full h-full overflow-hidden">
          <LazyImage
            src={product.imageVariants?.large || product.imageVariants?.medium || product.image || '/placeholder-product.jpg'}
            alt={name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
            avifSrcSet={imageSources.avifSrcSet}
            webpSrcSet={imageSources.webpSrcSet}
            width={400}
            height={400}
            priority={priority}
          />
          
          {/* High-quality overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
        
        <ProductBadges
          product={product}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
          outOfStock={outOfStock}
          showImageBadge={showImageBadge}
          locale={locale}
        />
        
        {/* Enhanced overlay actions with better animations */}
        <div className="product-overlay pointer-events-none absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <button
              className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickView(e); }}
              aria-label={t('quickView')}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 hover:from-emerald-600 hover:to-teal-600"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product, 1); }}
              aria-label={t('addToCart')}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {/* Quick action badges */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-auto">
            {hasDiscount && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                {locale === 'ar' ? 'عرض خاص' : 'Special Offer'}
              </div>
            )}
            {product.rating >= 4.5 && (
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {locale === 'ar' ? 'ممتاز' : 'Excellent'}
              </div>
            )}
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="product-title clamp-2 text-base font-semibold text-gray-900 mb-2">{name}</h3>

        <RatingStars rating={product.rating} />

        <PriceDisplay
        price={product.price}
        baseOld={baseOld}
        hasDiscount={hasDiscount}
        discountPercent={discountPercent}
        savings={savings}
        showPriceBadge={showPriceBadge}
        locale={locale}
      />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <AddToCartButton
              product={product}
              currentQty={currentQty}
              maxPerItem={maxPerItem}
              outOfStock={outOfStock}
              locale={locale}
              t={t}
              onAddToCart={handleAddToCart}
            />
          </div>
          <Link to={detailsPath} className="text-sm text-gray-600 hover:text-primary-600 pointer-events-auto">
            {t('details')}
          </Link>
        </div>
      </div>
      
      {open && (
        <QuickViewModal 
          product={product} 
          onClose={() => setOpen(false)} 
        />
      )}
    </div>
  );
};

export default memo(ProductCard);

// Skeleton and grid helpers expected by callers (e.g., Home, grids)
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-300" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-6 bg-gray-300 rounded w-full" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-10 bg-gray-300 rounded" />
    </div>
  </div>
);

export const ProductCardGrid = ({ children, columns = 4 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
    {children}
  </div>
);
