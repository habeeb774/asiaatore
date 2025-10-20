import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import Rating from './Rating'
import LazyImage from './LazyImage'
import { useLanguage } from '../../context/LanguageContext'
import { resolveLocalized } from '../../utils/locale'


const ProductCard = ({ product }) => {
  const { addToCart, cartItems, maxPerItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [addedState, setAddedState] = useState('idle') // idle | added | max
  const current = cartItems?.find(i => i.id === product.id)
  const currentQty = current?.quantity || 0
  const reachedMax = currentQty >= (maxPerItem || 10)

  useEffect(() => {
    if (reachedMax) setAddedState('max')
  }, [reachedMax])

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (reachedMax) return
    const res = addToCart(product, 1)
    if (res?.ok) {
      setAddedState(reachedMax || (res.type==='increment' && (currentQty+1)>=maxPerItem) ? 'max' : 'added')
      setTimeout(() => setAddedState(reachedMax ? 'max' : 'idle'), 1500)
    } else if (res?.reason === 'AUTH_REQUIRED') {
      const from = location.pathname + (location.search || '')
      navigate('/login', { state: { from } })
    }
  }

  const mainImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image || '/vite.svg'
  // Unify discount logic: support oldPrice or originalPrice against price
  const baseOldRaw = (product.oldPrice ?? product.originalPrice)
  const baseOld = baseOldRaw != null ? +baseOldRaw : undefined
  const basePrice = product.price != null ? +product.price : undefined
  const hasDiscount = Number.isFinite(baseOld) && Number.isFinite(basePrice) && baseOld > basePrice
  const discountPercent = hasDiscount ? Math.round(((baseOld - basePrice) / baseOld) * 100) : 0
  const savings = hasDiscount ? Math.max(0, baseOld - basePrice) : 0
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar'
  const nameText = resolveLocalized(product.name, locale) || product.slug || 'منتج'
  const descText = product.description ? resolveLocalized(product.description, locale) : ''

  return (
    <div className="product-card" aria-label={nameText}>
      <Link to={`/products/${product.id}`} className="product-image" aria-label={`عرض ${nameText}`}>
        <LazyImage src={mainImage} alt={nameText} />
        {hasDiscount && (
          <span className="discount-badge" aria-label={`خصم ${discountPercent}%`}>
            -{discountPercent}%
          </span>
        )}
        {Array.isArray(product.images) && product.images.length > 1 && (
          <div className="gallery-indicator" aria-label={`عدد الصور: ${product.images.length}`}>{product.images.length} صور</div>
        )}
        <div className="product-overlay">
          <button className="quick-view-btn" type="button" aria-label="معاينة سريعة">معاينة</button>
        </div>
      </Link>
      <div className="product-info">
        <div className="product-meta">
          {product.sellerName && <span className="seller" aria-label="البائع">{product.sellerName}</span>}
          {product.category && <span className="category" aria-label="التصنيف">{product.category}</span>}
        </div>
        <h3 className="product-name">
          <Link to={`/products/${product.id}`}>{nameText}</Link>
        </h3>
        <div className="product-rating">
          <Rating rating={product.rating} />
          {product.reviewCount != null && <span className="review-count">({product.reviewCount})</span>}
        </div>
  {descText && <p className="product-description">{descText}</p>}
        <div className="product-footer">
          <div className="price-row">
            <span className="new-price">{product.price} ر.س</span>
            {hasDiscount && <span className="old-price">{baseOld} ر.س</span>}
            {hasDiscount && (
              <span className="save-badge" aria-label={`وفرت ${savings} ر.س`}>
                {`وفّرت ${savings} ر.س`}
              </span>
            )}
          </div>
          <button
            className={`add-to-cart-btn ${addedState==='added' ? 'added' : ''} ${addedState==='max' ? 'at-max' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || reachedMax}
            aria-disabled={product.stock === 0 || reachedMax}
            aria-live="polite"
            aria-label={product.stock === 0 ? 'غير متوفر' : reachedMax ? 'الحد الأقصى في السلة' : `أضف ${nameText} للسلة`}
            title={reachedMax ? 'تم بلوغ الحد الأقصى للكمية' : undefined}
          >
            {product.stock === 0 ? 'غير متوفر'
              : reachedMax ? 'الحد الأقصى'
              : addedState === 'added' ? '✔ تمت الإضافة'
              : 'أضف للسلة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard