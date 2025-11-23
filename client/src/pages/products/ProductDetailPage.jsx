import React, { useMemo, useState, useCallback } from 'react';
// Page-scoped styles (moved from global main.jsx)
// Styles consolidated into `styles/index.scss`
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Seo from '../../components/Seo';
import LazyImage from '../../components/shared/LazyImage/LazyImage';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import useSiteName from '../../hooks/useSiteName';
import { useProducts } from '../../contexts/ProductsContext';
import { localizeName, localizeField } from '../../utils/locale';
import { useCart } from '../../contexts/CartContext';
import ProductReviews from '../../components/ProductReviews';
import { useSettings } from '../../contexts/SettingsContext';
import ProductDetailSkeleton from '../../components/products/ProductDetailSkeleton.jsx';
import { useExperimentVariant } from '../../contexts/ExperimentContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const productsCtx = useProducts() || {};
  const { getProductById, products = [] } = productsCtx;
  const { addToCart } = useCart() || { addToCart: () => {} };
  const { addToWishlist, wishlistItems, removeFromWishlist } = useWishlist() || {};
  const { user } = useAuth() || {};
  const toast = useToast?.() || null;
  const { variant: buttonVariant, track: trackExperiment } = useExperimentVariant('add-to-cart-button');
  const addToCartVariant = buttonVariant || 'default';
  const product = getProductById ? getProductById(id) : null;
  const fallback = useMemo(()=>({
    id,
    name: locale === 'ar' ? { ar: `منتج رقم ${id}`, en: `Product #${id}` } : { ar: `منتج رقم ${id}`, en: `Product #${id}` },
    short: { ar: 'وصف مختصر للمنتج (تجريبي).', en: 'Short experimental product description.' },
  image: '/vite.svg',
    price: 99,
    stock: 5
  }), [id, locale]);
  const isLoading = !product; // context may hydrate after mount
  const p = product || fallback;
  const displayName = localizeName(p, locale);
  const descriptionText = localizeField(p, 'short', locale);

  const siteName = useSiteName({ locale });
  const title = `${displayName} | ${siteName}`;
  const description = descriptionText;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    image: [p.image],
    description: descriptionText,
    sku: p.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'SAR',
      price: String(p.price || 0),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  // Canonical URL for SEO
  const productUrl = typeof window !== 'undefined' ? window.location.href : `/products/${p.slug || p.id}`;

  const [quantity, setQuantity] = useState(1);
  const isInWishlist = Boolean(wishlistItems?.find(i => i.id === p.id));

  const onAddToCart = useCallback(() => {
    if (!p || !p.id) return;
    
    // Track A/B testing event
    trackExperiment('add_to_cart', {
      productId: p.id,
      productName: displayName,
      price: p.price,
      quantity: quantity,
      buttonVariant: addToCartVariant
    });
    
    const result = addToCart(p, Number(quantity));
    if (result?.ok) {
      try { toast?.success?.(locale === 'ar' ? 'تمت الإضافة' : 'Added to cart', locale === 'ar' ? 'تمت إضافة المنتج بنجاح' : 'Product added to cart'); } catch {}
    } else if (result?.reason === 'AUTH_REQUIRED') {
      try { window.dispatchEvent(new CustomEvent('auth:required', { detail: { action: 'add_to_cart', productId: p.id } })); } catch {}
    }
  }, [p, quantity, addToCart, toast, locale, trackExperiment, displayName, addToCartVariant]);

  const onToggleWishlist = useCallback(() => {
    if (!user) {
      try { window.dispatchEvent(new CustomEvent('auth:required', { detail: { action: 'add_to_wishlist' } })); } catch {}
      try { toast?.warn?.(locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required', locale === 'ar' ? 'سجل الدخول لإضافة عناصر للمفضلة' : 'Please log in to add wishlist items'); } catch {}
      return;
    }
    try {
      if (isInWishlist) removeFromWishlist?.(p.id);
      else addToWishlist?.(p);
      toast?.success?.(locale === 'ar' ? 'تم التحديث' : 'Updated', isInWishlist ? (locale==='ar'?'أزيل من المفضلة':'Removed from wishlist') : (locale==='ar'?'أضيف للمفضلة':'Added to wishlist'));
    } catch {}
  }, [isInWishlist, addToWishlist, removeFromWishlist, p, user, toast, locale]);

  // Suggest similar products: same brand or category, exclude current
  const similarProducts = useMemo(() => {
    try {
      const productsList = products || [];
      const cand = (productsList || []).filter(pr => pr.id !== p.id && (pr.brand === p.brand || pr.category === p.category));
      return cand.slice(0, 4);
    } catch { return []; }
  }, [p, products]);

  return (
    <div className="product-detail" aria-busy={isLoading ? 'true' : 'false'} aria-live="polite">
  <Seo title={title} description={description} image={p.image} url={productUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(productLd)}} />
      {isLoading ? (
        <ProductDetailSkeleton />
      ) : (
        <>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="breadcrumbs" style={{marginBottom:8}}>
            <Link to={`/${locale === 'ar' ? 'ar' : 'en'}/`}>{locale === 'ar' ? 'الصفحة الرئيسية' : 'Home'}</Link>
            <span aria-hidden="true">›</span>
            <Link to={`/products?category=${encodeURIComponent(p.category || '')}`}>{p.category || (locale === 'ar' ? 'منتجات' : 'Products')}</Link>
            <span aria-hidden="true">›</span>
            <span>{displayName}</span>
          </nav>
          <h1>{displayName}</h1>
          <p>{descriptionText}</p>
          <div style={{maxWidth:'640px'}}>
            <LazyImage src={p.image} alt={displayName} className="w-full rounded-lg" placeholder="skeleton" />
          </div>
          <div style={{marginTop:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <label htmlFor="qty" style={{fontSize:'.9rem', fontWeight:700, marginInlineEnd:8}}>{locale==='ar'?'الكمية':'Quantity'}</label>
              <div style={{display:'flex', alignItems:'center', gap:4}}>
                <button type="button" aria-label="Decrease" disabled={quantity<=1} onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="btn-plain">-</button>
                <input id="qty" aria-label="Quantity input" type="number" min="1" max={p.stock || 999} value={quantity} onChange={(e)=> setQuantity(Math.min(Math.max(1, Number(e.target.value||1)), p.stock||999))} style={{width:60, textAlign:'center'}} />
                <button type="button" aria-label="Increase" disabled={quantity>= (p.stock || 999)} onClick={()=>setQuantity(q=>Math.min((p.stock||999), q+1))} className="btn-plain">+</button>
              </div>
            </div>
            {/* A/B Testing: Different button styles based on variant */}
            {addToCartVariant === 'default' && (
              <button className="btn-primary" aria-disabled={p.stock<=0} disabled={p.stock<=0} onClick={onAddToCart}>
                {p.stock<=0 ? (locale==='ar'?'غير متوفر':'Out of stock') : (locale==='ar'?'أضف للسلة':'Add to cart')}
              </button>
            )}
            {addToCartVariant === 'colorful' && (
              <button 
                className="btn-primary" 
                aria-disabled={p.stock<=0} 
                disabled={p.stock<=0} 
                onClick={onAddToCart}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)'
                }}
              >
                {p.stock<=0 ? (locale==='ar'?'غير متوفر':'Out of stock') : (
                  <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    🛒 {locale==='ar'?'أضف للسلة الآن':'Add to cart now'}
                  </span>
                )}
              </button>
            )}
            {addToCartVariant === 'minimal' && (
              <button 
                className="btn-secondary" 
                aria-disabled={p.stock<=0} 
                disabled={p.stock<=0} 
                onClick={onAddToCart}
                style={{
                  border: '2px solid #333',
                  background: 'transparent',
                  color: '#333',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  fontWeight: '500',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {p.stock<=0 ? (locale==='ar'?'غير متوفر':'Out of stock') : (locale==='ar'?'إضافة للسلة':'Add to cart')}
              </button>
            )}
            <span style={{fontSize:'.85rem', color:'#444'}}>{locale==='ar'?'المخزون':'Stock'}: {p.stock}</span>
            <button type="button" onClick={onToggleWishlist} className="btn-ghost" aria-pressed={isInWishlist} style={{marginInlineStart:8}}>
              {isInWishlist ? (locale==='ar' ? 'إزالة من المفضلة' : 'Remove from wishlist') : (locale==='ar' ? 'أضف للمفضلة' : 'Add to wishlist')}
            </button>
            <button type="button" onClick={()=>{
              if (navigator.share) { navigator.share({ title, text: description, url: productUrl }).catch(()=>{}); }
              else { navigator.clipboard?.writeText(productUrl); toast?.info?.(locale==='ar'?'تم نسخ الرابط':'Link copied'); }
            }} className="btn-ghost">{locale==='ar'?'مشاركة':'Share'}</button>
          </div>
          <ProductReviews productId={p.id} />
          {/* Similar Products */}
          {similarProducts && similarProducts.length > 0 && (
            <section aria-labelledby="similar-title" style={{marginTop:24}}>
              <h3 id="similar-title" style={{fontSize:'.95rem', fontWeight:700}}>{locale==='ar'?'قد يعجبك أيضاً':'You may also like'}</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginTop:8}}>
                {similarProducts.map(sp => (
                  <article key={sp.id} style={{border:'1px solid #eaeaea', padding:8, borderRadius:8}}>
                    <Link to={`/products/${sp.slug||sp.id}`}>
                      <LazyImage src={sp.displayImage||sp.image} alt={sp.nameEn || sp.name || 'Product'} className="w-full h-32 object-cover rounded" />
                      <div style={{marginTop:8}}>{locale==='ar' ? (sp.nameAr || sp.name) : (sp.nameEn || sp.name)}</div>
                      <div style={{fontWeight:700, color:'#16a34a'}}>{Number(sp.price||0).toFixed(2)} ر.س</div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ProductDetailPage;
