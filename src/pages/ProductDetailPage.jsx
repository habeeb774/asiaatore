import React, { useMemo } from 'react';
// Page-scoped styles (moved from global main.jsx)
import '../styles/product-details.scss';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';
import { useProducts } from '../context/ProductsContext';
import { localizeName, localizeField } from '../utils/locale';
import { useCart } from '../context/CartContext';
import ProductReviews from '../components/ProductReviews';
import { useSettings } from '../context/SettingsContext';
import ProductDetailSkeleton from '../components/products/ProductDetailSkeleton.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const { getProductById } = useProducts() || {};
  const { addToCart } = useCart() || { addToCart: () => {} };
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

  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
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

  return (
    <div className="product-detail" aria-busy={isLoading ? 'true' : 'false'} aria-live="polite">
      <Seo title={title} description={description} image={p.image} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(productLd)}} />
      {isLoading ? (
        <ProductDetailSkeleton />
      ) : (
        <>
          <h1>{displayName}</h1>
          <p>{descriptionText}</p>
          <img src={p.image} alt={displayName} style={{maxWidth:'100%', borderRadius:8}} />
          <div style={{marginTop:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
            <button className="btn-primary" disabled={p.stock<=0} onClick={()=>addToCart(p)}>
              {p.stock<=0 ? (locale==='ar'?'غير متوفر':'Out of stock') : (locale==='ar'?'أضف للسلة':'Add to cart')}
            </button>
            <span style={{fontSize:'.85rem', color:'#444'}}>{locale==='ar'?'المخزون':'Stock'}: {p.stock}</span>
          </div>
          <ProductReviews productId={p.id} />
        </>
      )}
    </div>
  );
};

export default ProductDetailPage;
