import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import QuickViewModal from './QuickViewModal';
import { useNavigate, useLocation } from 'react-router-dom';
import LazyImage from '../common/LazyImage';
import { resolveLocalized } from '../../utils/locale';

const ProductCard = ({ product, showImageBadge = true, showPriceBadge = true, priority = false }) => {
  const { locale, t } = useLanguage();
  const { addToCart, cartItems, maxPerItem } = useCart() || { addToCart: () => {}, cartItems: [], maxPerItem: 10 };
  const navigate = useNavigate();
  const location = useLocation();
  const [btnState, setBtnState] = useState('idle'); // idle | added | max
  const current = cartItems?.find(i => i.id === product.id);
  const currentQty = current?.quantity || 0;
  const reachedMax = currentQty >= (maxPerItem || 10);
  useEffect(()=> { if (reachedMax) setBtnState('max'); }, [reachedMax]);
  const [open, setOpen] = useState(false);
  const name = resolveLocalized(product?.name ?? product?.title, locale) || (typeof product?.name === 'string' ? product.name : product?.title) || '';
  const detailsPath = `${locale === 'ar' ? '' : '/' + locale}/product/${product.id}`;
  const baseOldRaw = (product?.oldPrice ?? product?.originalPrice);
  const baseOld = baseOldRaw != null ? +baseOldRaw : undefined;
  const priceNum = product?.price != null ? +product.price : undefined;
  const hasDiscount = Number.isFinite(baseOld) && Number.isFinite(priceNum) && baseOld > priceNum;
  const discountPercent = hasDiscount ? Math.round( (1 - (priceNum / baseOld)) * 100 ) : null;
  const savings = hasDiscount ? Math.max(0, baseOld - priceNum) : 0;
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  return (
    <div className="product-card" data-id={product.id}>
      <Link to={detailsPath} className="product-image product-media" aria-label={name}>
        <LazyImage
          src={product.imageVariants?.thumb || product.image}
          alt={name}
          className="w-full h-full object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          avifSrcSet={product.imageVariants?.avif ? [
            product.imageVariants.avif.thumb && `${product.imageVariants.avif.thumb} 200w`,
            product.imageVariants.avif.medium && `${product.imageVariants.avif.medium} 400w`,
            product.imageVariants.avif.large && `${product.imageVariants.avif.large} 800w`
          ].filter(Boolean).join(', ') : undefined}
          webpSrcSet={product.imageVariants?.webp ? [
            product.imageVariants.webp.thumb && `${product.imageVariants.webp.thumb} 200w`,
            product.imageVariants.webp.medium && `${product.imageVariants.webp.medium} 400w`,
            product.imageVariants.webp.large && `${product.imageVariants.webp.large} 800w`
          ].filter(Boolean).join(', ') : undefined}
          width={400}
          height={400}
          priority={priority}
        />
  {product.badge && <span className="badge">{locale==='ar'? 'جديد':'New'}</span>}
  {showImageBadge && hasDiscount && <span className="discount-badge">-{discountPercent}%</span>}
        {outOfStock && <span className="gallery-indicator" style={{background:'rgba(109,1,11,.85)'}}>{locale==='ar'?'غير متوفر':'Out'}</span>}
        <div className="product-overlay">
          <button
            className="quick-view-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          >
            {t('quickView')}
          </button>
        </div>
      </Link>
      <h3 className="product-title clamp-2">{name}</h3>
      {product.rating && (
        <div className="rating-row" aria-label={`rating ${product.rating}`}>
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`star ${i <= product.rating ? '' : 'off'}`}>★</span>
          ))}
        </div>
      )}
      <div className="price-row">
        <span className="price">{product.price} {locale==='ar'?'ر.س':'SAR'}</span>
        {Number.isFinite(baseOld) && <span className="old">{baseOld}</span>}
        {showPriceBadge && hasDiscount && typeof discountPercent === 'number' && (
          <span className="badge-soft" style={{fontSize:'.62rem', padding:'.15rem .4rem', borderRadius:8, marginInlineStart:6}}>
            -{discountPercent}%
          </span>
        )}
        {hasDiscount && savings > 0 && (
          <span className="save-badge" aria-label={locale==='ar'?`وفرت ${savings} ر.س`:`Saved ${savings} SAR`}>
            {locale==='ar'?`وفّرت ${savings} ر.س`:`Saved ${savings} SAR`}
          </span>
        )}
      </div>
      <div className="actions">
        <button
          className={`primary ${btnState==='added'?'added':''} ${btnState==='max'?'at-max':''}`}
          disabled={outOfStock || reachedMax}
          onClick={() => {
            if (outOfStock || reachedMax) return;
            const res = addToCart(product, 1);
            if (res?.ok) {
              const willMax = (currentQty + 1) >= (maxPerItem||10);
              setBtnState(willMax ? 'max':'added');
              setTimeout(()=> setBtnState(willMax ? 'max':'idle'), 1400);
            } else if (res?.reason === 'AUTH_REQUIRED') {
              const from = location.pathname + (location.search || '');
              navigate('/login', { state: { from } });
            }
          }}
          aria-label={outOfStock ? (locale==='ar'?'غير متوفر':'Out of stock') : (reachedMax ? (locale==='ar'?'الحد الأقصى':'Max reached') : t('addToCart'))}
        >
          { outOfStock ? (locale==='ar'?'غير متوفر':'Out of stock') : reachedMax ? (locale==='ar'?'الحد الأقصى':'Max') : btnState==='added' ? (locale==='ar'?'✓ تمت الإضافة':'✓ Added') : t('addToCart') }
        </button>
        <Link to={detailsPath}>{t('details')}</Link>
      </div>
      {open && <QuickViewModal product={product} onClose={() => setOpen(false)} />}
    </div>
  );
};

export default ProductCard;