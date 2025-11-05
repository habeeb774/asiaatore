
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCart } from '../../../context/CartContext';
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
      {product.badge && (
        <span className="badge">
          {locale === 'ar' ? 'جديد' : 'New'}
        </span>
      )}
      {showImageBadge && hasDiscount && (
        <span className="discount-badge">
          -{discountPercent}%
        </span>
      )}
      {outOfStock && (
        <span 
          className="gallery-indicator" 
          style={{ background: 'rgba(109,1,11,.85)' }}
        >
          {locale === 'ar' ? 'غير متوفر' : 'Out'}
        </span>
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
  }, [reachedMax, btnState]);
  
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
  }, [product, currentQty, maxPerItem, outOfStock, reachedMax, onAddToCart]);
  
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
  }, [outOfStock, reachedMax, btnState, locale, t]);
  
  const getAriaLabel = useCallback(() => {
    if (outOfStock) {
      return locale === 'ar' ? 'غير متوفر' : 'Out of stock';
    }
    if (reachedMax) {
      return locale === 'ar' ? 'الحد الأقصى' : 'Max reached';
    }
    return t('addToCart');
  }, [outOfStock, reachedMax, locale, t]);
  
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
  }, [addToCart, navigate, location]);
  
  // معالج العرض السريع
  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);
  
  // مصادر الصور المحسنة
  const imageSources = useMemo(() => ({
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
  }), [product.imageVariants]);
  
  return (
    <div className="product-card group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transform transition-all duration-200 hover:scale-105" data-id={product.id}>
      <Link to={detailsPath} className="product-image product-media block relative bg-gray-50 aspect-square overflow-hidden" aria-label={name}>
        <LazyImage
          src={product.imageVariants?.thumb || product.image}
          alt={name}
          className="w-full h-full object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          avifSrcSet={imageSources.avifSrcSet}
          webpSrcSet={imageSources.webpSrcSet}
          width={400}
          height={400}
          priority={priority}
        />
        
        <ProductBadges
          product={product}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
          outOfStock={outOfStock}
          showImageBadge={showImageBadge}
          locale={locale}
        />
        
        {/* overlay actions (appear on hover) */}
        <div className="product-overlay pointer-events-none absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto">
            <button
              className="bg-white/90 text-gray-800 hover:bg-white p-2 rounded-lg shadow-md"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickView(e); }}
              aria-label={t('quickView')}
              type="button"
            >
              {t('quickView')}
            </button>
            <button
              className="bg-primary-600 text-white p-2 rounded-lg shadow-md hover:opacity-95"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product, 1); }}
              aria-label={t('addToCart')}
              type="button"
            >
              +
            </button>
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
