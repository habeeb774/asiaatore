import React, { useState, useEffect } from 'react';
import { motion } from '../../lib/framerLazy';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useMarketing } from '../../contexts/MarketingContext';
import { useHomeProducts } from '../../hooks/useHomeProducts';
import { useHomeCategories } from '../../hooks/useHomeCategories';
import HeroModern from '../../components/shared/Hero/HeroModern';
import ProductCardModern from '../../components/shared/ProductCard/ProductCardModern';
import LazyImage from '../../components/shared/LazyImage/LazyImage';
import { 
  ShoppingCart, 
  Star, 
  TrendingUp, 
  Truck, 
  Shield, 
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * HomePageModern - الصفحة الرئيسية الحديثة والمحسّنة
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - دعم كامل للـ RTL
 * - عرض المنتجات والفئات
 * - أقسام تفاعلية
 * - أداء محسّن
 */
const HomePageModern = () => {
  const { locale, t } = useLanguage();
  const { setting } = useSettings();
  const { featuredProducts, newProducts, saleProducts, loading: productsLoading } = useHomeProducts();
  const { categories, loading: categoriesLoading } = useHomeCategories();
  const { banners, promotions } = useMarketing();
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [featuredProduct, setFeaturedProduct] = useState(null);
  
  const isRTL = locale === 'ar';
  
  // تعيين المنتج المميز الأول
  useEffect(() => {
    if (featuredProducts && featuredProducts.length > 0) {
      setFeaturedProduct(featuredProducts[0]);
    }
  }, [featuredProducts]);
  
  // معالجة النقر على الفئة
  const handleCategoryClick = (category) => {
    setActiveCategory(activeCategory?.id === category.id ? null : category);
  };
  
  // معالجة العرض السريع
  const handleQuickView = (product) => {
    console.log('Quick view:', product);
    // يمكن فتح نافذة منبثقة للعرض السريع
  };
  
  // بيانات المميزات
  const features = [
    {
      icon: Truck,
      title: t('free_shipping'),
      description: t('free_shipping_desc'),
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: t('secure_payment'),
      description: t('secure_payment_desc'),
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: t('fast_delivery'),
      description: t('fast_delivery_desc'),
      color: 'text-purple-600'
    },
    {
      icon: Star,
      title: t('quality_products'),
      description: t('quality_products_desc'),
      color: 'text-yellow-600'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroModern 
        autoPlay={true}
        interval={6000}
        showDots={true}
        showArrows={true}
        height="hero"
      />
      
      {/* Features Bar */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <div className={`p-3 rounded-lg bg-gray-50 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('shop_by_category')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('category_description')}
            </p>
          </motion.div>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-square mb-2" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories?.slice(0, 6).map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCategoryClick(category)}
                  className={`group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 ${
                    activeCategory?.id === category.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                    <LazyImage
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  {category.products_count && (
                    <p className="text-xs text-gray-500 mt-1">
                      {category.products_count} {t('products')}
                    </p>
                  )}
                  
                  {/* Active indicator */}
                  {activeCategory?.id === category.id && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 ring-2 ring-blue-500 rounded-lg pointer-events-none"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="text-yellow-500" size={24} />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('featured_products')}
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('featured_products_description')}
            </p>
          </motion.div>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCardModern
                    product={product}
                    variant="default"
                    showQuickView={true}
                    showAddToCart={true}
                    showWishlist={true}
                    showRating={true}
                    onQuickView={handleQuickView}
                  />
                </motion.div>
              ))}
            </div>
          )}
          
          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => window.location.href = '/products'}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              {t('view_all_products')}
              <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </motion.div>
        </div>
      </section>
      
      {/* New Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="text-green-500" size={24} />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('new_products')}
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('new_products_description')}
            </p>
          </motion.div>
          
          {!productsLoading && newProducts && newProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCardModern
                    product={product}
                    variant="compact"
                    showQuickView={true}
                    showAddToCart={true}
                    showWishlist={true}
                    showRating={false}
                    onQuickView={handleQuickView}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Promotions Banner */}
      {promotions && promotions.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {promotions[0].title?.[locale] || promotions[0].title?.en || t('special_offer')}
              </h2>
              <p className="text-lg mb-8 opacity-90">
                {promotions[0].description?.[locale] || promotions[0].description?.en || t('limited_time_offer')}
              </p>
              <button
                onClick={() => window.location.href = promotions[0].cta_link || '/offers'}
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                {promotions[0].cta_text?.[locale] || promotions[0].cta_text?.en || t('shop_now')}
                <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </motion.div>
          </div>
        </section>
      )}
      
      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('newsletter_title')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('newsletter_description')}
              </p>
              <form className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder={t('enter_email')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t('subscribe')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePageModern;
