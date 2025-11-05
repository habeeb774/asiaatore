import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Clock, Heart, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';
import api from '../api/client';
import ProductDetailSkeleton from '../components/products/ProductDetailSkeleton.jsx';
import ZoomableImage from '../components/products/ZoomableImage.jsx';
import LazyImage from '../components/common/LazyImage.jsx';
import Button, { buttonVariants } from '../components/ui/Button';

const ProductDetails = () => {
  const { id } = useParams();
  const { products } = useProducts() || { products: [] };
  const initial = products.find(p => String(p.id) === String(id));
  const [product, setProduct] = useState(initial || null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);
  const placeholderImg = '/vite.svg';
  const { addToCart } = useCart() || { addToCart: () => {} };
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  const nameText = useMemo(() => resolveLocalized(product?.name, locale) || 'منتج', [product, locale]);
  const descText = useMemo(() => resolveLocalized(product?.description, locale) || '', [product, locale]);

  useEffect(() => {
    let active = true;
    if (!product) {
      setLoading(true); setError(null);
      api.getProduct(id)
        .then(p => { if (active) setProduct(p); })
        .catch(e => { if (active) setError(e.message); })
        .finally(()=> { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [id]);

  const tierPrices = useMemo(() => (product?.tierPrices || []).slice().sort((a,b)=>a.minQty-b.minQty), [product]);
  const effectiveUnitPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.price;
    if (!tierPrices.length) return base;
    const applicable = tierPrices.filter(t => quantity >= t.minQty).sort((a,b)=> b.minQty - a.minQty)[0];
    return applicable ? Math.min(base, applicable.price) : base;
  }, [product, tierPrices, quantity]);
  const totalPrice = (effectiveUnitPrice * quantity).toFixed(2);
  const oldPriceRaw = product?.originalPrice ?? product?.oldPrice;
  const oldPrice = oldPriceRaw != null ? +oldPriceRaw : undefined;
  const priceNum = product?.price != null ? +product.price : undefined;
  const hasDiscount = Number.isFinite(oldPrice) && Number.isFinite(priceNum) && oldPrice > priceNum;
  const discountAmount = hasDiscount ? (oldPrice - priceNum) : 0;
  const discountPercent = hasDiscount ? Math.round((1 - (priceNum / oldPrice)) * 100) : 0;
  const outOfStock = product?.stock != null && product.stock <= 0;

  // swipe gestures for switching images on mobile (declare hooks before any early returns)
  const swipeRef = useRef(null);
  useEffect(() => {
    const el = swipeRef.current; if (!el) return;
    let startX = 0, currentX = 0, touching = false, delta = 0;
    const onTouchStart = (e) => { touching = true; startX = e.touches[0].clientX; };
    const onTouchMove = (e) => { if (!touching) return; currentX = e.touches[0].clientX; delta = currentX - startX; };
    const onTouchEnd = () => {
      if (!touching) return; touching = false;
      if (Math.abs(delta) > 50) {
        if (delta < 0) setSelectedImage((i)=> Math.min((product?.gallery?.length||1)-1, i+1));
        else setSelectedImage((i)=> Math.max(0, i-1));
      }
      delta = 0;
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [product?.gallery?.length]);

  if (loading) return (
    <div className="container-custom px-4 py-8" aria-busy="true" aria-live="polite">
      <ProductDetailSkeleton />
    </div>
  );
  if (error) return <div className="container-custom px-4 py-8 text-red-600 text-sm">خطأ: {error}</div>;
  if (!product) return <div className="container-custom px-4 py-8">المنتج غير موجود</div>;

  const handleAddToCart = () => {
    if (outOfStock) {
      try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'warn', title: 'غير متوفر', description: 'هذا المنتج غير متاح حالياً في المخزون' } })); } catch {}
      return;
    }
    addToCart({ ...product, quantity, price: effectiveUnitPrice });
  };

  const toggleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };


  return (
    <div className="pt-20 min-h-screen bg-gray-50 product-details-page">
      <div className="container-custom px-4 py-8">
        {/* مسار التنقل */}
        <nav className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-8 breadcrumb">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ArrowRight size={16} />
          <Link to="/products" className="hover:text-primary">المنتجات</Link>
          <ArrowRight size={16} />
          <span className="text-primary">{nameText}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div ref={swipeRef} className="bg-white rounded-2xl p-3 md:p-6 shadow-lg mb-4 select-none">
              <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                <ZoomableImage
                  src={(product.gallery?.[selectedImage]?.variants?.large) || (product.gallery?.[selectedImage]?.variants?.medium) || product.gallery?.[selectedImage]?.url || product.image || placeholderImg}
                  alt={nameText}
                  onError={(e)=>{ try{ e.currentTarget.src = placeholderImg; }catch{} }}
                  className="w-full h-full"
                />
                {product.gallery?.length > 1 && (
                  <div className="absolute bottom-2 inset-x-2 hidden md:flex justify-between pointer-events-none">
                    <span className="pointer-events-auto bg-black/40 text-white px-2 py-1 rounded-full text-xs">{selectedImage+1} / {product.gallery.length}</span>
                  </div>
                )}
              </div>
            </div>
            {product.gallery?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 snap-x snap-mandatory" role="tablist" aria-label="thumbnails">
                {product.gallery.map((img, idx) => (
                    <button
                    key={img.id || idx}
                    onClick={()=>setSelectedImage(idx)}
                    role="tab"
                    aria-selected={selectedImage===idx}
                    className={`border rounded-lg p-1 min-w-[5rem] w-20 h-20 overflow-hidden flex-shrink-0 snap-start ${selectedImage===idx?'ring-2 ring-primary':''}`}
                  >
                    <LazyImage
                      src={img.variants?.thumb || img.variants?.medium || img.url}
                      alt={resolveLocalized(img.alt, locale) || img.alt?.ar || img.alt?.en || 'صورة'}
                      className="w-full h-full object-cover"
                      sizes="80px"
                      skeleton={true}
                      onLoad={()=>{ /* no-op */ }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* معلومات المنتج */}
          <div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {resolveLocalized(product.category, locale) || product.category}
                </span>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <button 
                    onClick={toggleWishlist}
                    className={`p-2 rounded-full ${
                      isInWishlist(product.id) 
                        ? 'text-red-500 bg-red-50' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart 
                      size={24} 
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-primary-red rounded-full hover:bg-gray-100">
                    <Share2 size={24} />
                  </button>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">{nameText}</h1>
              {product.brand && (
                <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded">{resolveLocalized(product.brand.name, locale) || product.brand.name?.ar || product.brand.name?.en}</span>
                  {product.brand.logo && <img src={product.brand.logo} alt={resolveLocalized(product.brand.name, locale) || product.brand.name?.ar || product.brand.name?.en} className="h-6 object-contain" />}
                </div>
              )}

                <div className="flex items-center space-x-4 space-x-reverse mb-6">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={20} 
                        fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 mr-2">({product.rating})</span>
                </div>
                <span className="text-gray-500">• {product.reviews} تقييم</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center flex-wrap gap-3 mb-2">
                  <span className="text-3xl font-bold text-primary">{effectiveUnitPrice.toFixed(2)} ر.س</span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-gray-500 line-through">{oldPrice} ر.س</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        وفر {discountAmount.toFixed(2)} ر.س • -{discountPercent}%
                      </span>
                    </>
                  )}
                  {tierPrices.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">تسعير بالجملة متاح</span>
                  )}
                </div>
                <p className="text-green-600 font-medium">{product.stock > 0 ? '✓ متوفر في المخزون' : 'غير متوفر'}</p>
                {tierPrices.length > 0 && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-right">الكمية من</th>
                          <th className="p-2 text-right">السعر للوحدة</th>
                          <th className="p-2 text-right">ملاحظة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tierPrices.map(t => (
                          <tr key={t.id} className={quantity >= t.minQty ? 'bg-amber-50' : ''}>
                            <td className="p-2">{t.minQty}+</td>
                            <td className="p-2 font-medium">{t.price.toFixed(2)} ر.س</td>
                            <td className="p-2 text-xs">{resolveLocalized(t.note, locale) || t.note?.ar || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">{descText}</p>
                {product.type === 'digital' && product.downloadUrl && (
                  <div className="mb-6">
                    <Button as="a" href={product.downloadUrl} variant="primary" className="inline-block" download>
                      تحميل المنتج الرقمي
                    </Button>
                  </div>
                )}

              {/* الميزات */}
              <div className="mb-8">
                <h3 className="font-bold mb-4">المميزات:</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {(product.features || []).map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 space-x-reverse">
                      <div className="feature-dot"></div>
                      <span className="text-gray-600">{resolveLocalized(feature, locale) || feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* الكمية وإضافة للسلة */}
              <div className="flex items-center space-x-6 space-x-reverse mb-8">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:text-primary-red"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-l border-r border-gray-300">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:text-primary-red"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col flex-1 gap-2">
                  <Button onClick={handleAddToCart} className="flex-1 py-3 text-lg" variant="primary" disabled={outOfStock} aria-disabled={outOfStock}>
                    أضف إلى السلة (الإجمالي: {totalPrice} ر.س)
                  </Button>
                  {effectiveUnitPrice !== product.price && (
                    <span className="text-xs text-amber-700">تم تطبيق سعر الجملة</span>
                  )}
                </div>
              </div>

              {/* معلومات الشحن */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Truck className="text-primary-red" size={24} />
                  <div>
                    <p className="font-medium">شحن مجاني</p>
                    <p className="text-sm text-gray-600">لطلبات فوق 500 ر.س</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Shield className="text-primary-red" size={24} />
                  <div>
                    <p className="font-medium">ضمان الجودة</p>
                    <p className="text-sm text-gray-600">منتجات أصلية 100%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Clock className="text-primary-red" size={24} />
                  <div>
                    <p className="font-medium">توصيل سريع</p>
                    <p className="text-sm text-gray-600">2-3 أيام عمل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-6">المواصفات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-600">{key.replace('_', ' ')}</span>
                  <span className="text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {products && products.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">منتجات ذات صلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.filter(p => p.category === product.category && p.id !== product.id).slice(0,3).map(relatedProduct => (
                <motion.div key={relatedProduct.id} className="product-card p-6" whileHover={{ y: -5 }}>
                  <div className="relative mb-4">
                    <img
                      src={relatedProduct.displayImage || relatedProduct.image || placeholderImg}
                      alt={resolveLocalized(relatedProduct.name, locale) || 'منتج'}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e)=>{ e.currentTarget.src = placeholderImg; }}
                    />
                    <span className="absolute top-2 right-2 bg-primary-red text-white px-2 py-1 rounded text-sm">{relatedProduct.category}</span>
                    {((relatedProduct.originalPrice ?? relatedProduct.oldPrice) > (relatedProduct.price || 0)) && (()=>{
                      const op = +(relatedProduct.originalPrice ?? relatedProduct.oldPrice);
                      const pr = +(relatedProduct.price || 0);
                      const pct = Math.round((1 - (pr/op)) * 100);
                      return <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs">-{pct}%</span>;
                    })()}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{resolveLocalized(relatedProduct.name, locale)}</h3>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary-red">{relatedProduct.price} ر.س</span>
                      {(relatedProduct.originalPrice ?? relatedProduct.oldPrice) && (relatedProduct.originalPrice ?? relatedProduct.oldPrice) > (relatedProduct.price || 0) && (
                        <span className="text-sm text-gray-500 line-through">{(relatedProduct.originalPrice ?? relatedProduct.oldPrice)} ر.س</span>
                      )}
                    </div>
                    <Link to={`/product/${relatedProduct.id}`} className={buttonVariants({ variant: 'primary', size: 'sm', className: 'text-sm px-4 py-2' })}>عرض المنتج</Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* شريط شراء مثبت أسفل الشاشة للجوال */}
      <div className="sticky-buybar lg:hidden">
        <div className="inner">
          <div className="price">{effectiveUnitPrice.toFixed(2)} ر.س</div>
          <Button onClick={handleAddToCart} className="flex-1 py-3 text-base" variant="primary" disabled={outOfStock} aria-disabled={outOfStock}>أضف إلى السلة</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;