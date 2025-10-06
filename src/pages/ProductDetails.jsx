import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Truck, Shield, Clock, Heart, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';
import api from '../api/client';

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
  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
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

  if (loading) return <div className="container-custom px-4 py-8">جاري التحميل...</div>;
  if (error) return <div className="container-custom px-4 py-8 text-red-600 text-sm">خطأ: {error}</div>;
  if (!product) return <div className="container-custom px-4 py-8">المنتج غير موجود</div>;

  const handleAddToCart = () => {
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
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
              <img
                src={(product.gallery?.[selectedImage]?.variants?.medium) || product.gallery?.[selectedImage]?.url || product.image || placeholderImg}
                alt={nameText}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e)=>{ e.currentTarget.src = placeholderImg; }}
              />
            </div>
            {product.gallery?.length > 1 && (
              <div className="flex flex-wrap gap-3">
                {product.gallery.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={()=>setSelectedImage(idx)}
                    className={`border rounded-lg p-1 w-20 h-20 overflow-hidden ${selectedImage===idx?'ring-2 ring-primary':''}`}
                  >
                    <img
                      src={img.variants?.thumb || img.variants?.medium || img.url}
                      alt={img.alt?.ar || img.alt?.en || 'صورة'}
                      className="w-full h-full object-cover"
                      onError={(e)=>{ e.currentTarget.src = placeholderImg; }}
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
                  {product.category}
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
                  <span className="px-2 py-1 bg-gray-100 rounded">{product.brand.name?.ar}</span>
                  {product.brand.logo && <img src={product.brand.logo} alt={product.brand.name?.ar} className="h-6 object-contain" />}
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
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">{product.originalPrice} ر.س</span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">وفر {(product.originalPrice - product.price).toFixed(2)} ر.س</span>
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
                            <td className="p-2 text-xs">{t.note?.ar || ''}</td>
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
                    <a href={product.downloadUrl} className="btn-primary inline-block" download>
                      تحميل المنتج الرقمي
                    </a>
                  </div>
                )}

              {/* الميزات */}
              <div className="mb-8">
                <h3 className="font-bold mb-4">المميزات:</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {(product.features || []).map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 space-x-reverse">
                      <div className="feature-dot"></div>
                      <span className="text-gray-600">{feature}</span>
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
                  <button onClick={handleAddToCart} className="btn-primary flex-1 py-3 text-lg">
                    أضف إلى السلة (الإجمالي: {totalPrice} ر.س)
                  </button>
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
                      alt={relatedProduct.name || 'منتج'}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e)=>{ e.currentTarget.src = placeholderImg; }}
                    />
                    <span className="absolute top-2 right-2 bg-primary-red text-white px-2 py-1 rounded text-sm">{relatedProduct.category}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{resolveLocalized(relatedProduct.name, locale)}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-red">{relatedProduct.price} ر.س</span>
                    <Link to={`/product/${relatedProduct.id}`} className="btn-primary text-sm px-4 py-2">عرض المنتج</Link>
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
          <button onClick={handleAddToCart} className="btn-primary flex-1 py-3 text-base">أضف إلى السلة</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;