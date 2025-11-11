import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const AIProductRecommendations = ({
  userId,
  currentProductId,
  category,
  viewedProducts = [],
  purchasedProducts = [],
  maxRecommendations = 6,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');

  // AI-powered recommendation algorithms
  const recommendationAlgorithms = useMemo(() => ({
    personalized: {
      title: t('aiPersonalized'),
      description: t('aiPersonalizedDesc'),
      algorithm: 'collaborative_filtering'
    },
    trending: {
      title: t('aiTrending'),
      description: t('aiTrendingDesc'),
      algorithm: 'trending_analysis'
    },
    similar: {
      title: t('aiSimilar'),
      description: t('aiSimilarDesc'),
      algorithm: 'content_based'
    },
    complementary: {
      title: t('aiComplementary'),
      description: t('aiComplementaryDesc'),
      algorithm: 'market_basket'
    },
    seasonal: {
      title: t('aiSeasonal'),
      description: t('aiSeasonalDesc'),
      algorithm: 'seasonal_trends'
    }
  }), [t]);

  // Simulate AI recommendations (in real app, this would call an AI service)
  useEffect(() => {
    const generateRecommendations = async () => {
      setLoading(true);

      try {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockRecommendations = [
          {
            id: 'rec-1',
            name: 'منتج ذكي معزز بالذكاء الاصطناعي',
            nameEn: 'AI-Enhanced Smart Product',
            price: 299.99,
            originalPrice: 399.99,
            discount: 25,
            image: '/api/placeholder/300/300',
            rating: 4.8,
            reviews: 1247,
            category: 'Electronics',
            tags: ['AI', 'Smart', 'Premium'],
            aiScore: 0.95,
            reason: 'بناءً على مشترياتك السابقة واهتماماتك'
          },
          {
            id: 'rec-2',
            name: 'منتج مستدام صديق للبيئة',
            nameEn: 'Eco-Friendly Sustainable Product',
            price: 149.99,
            originalPrice: 199.99,
            discount: 25,
            image: '/api/placeholder/300/300',
            rating: 4.6,
            reviews: 892,
            category: 'Home',
            tags: ['Eco', 'Sustainable', 'Green'],
            aiScore: 0.88,
            reason: 'يتناسب مع قيمك البيئية المكتشفة'
          },
          {
            id: 'rec-3',
            name: 'منتج فاخر محدود الإصدار',
            nameEn: 'Limited Edition Luxury Product',
            price: 599.99,
            originalPrice: 799.99,
            discount: 25,
            image: '/api/placeholder/300/300',
            rating: 4.9,
            reviews: 456,
            category: 'Fashion',
            tags: ['Luxury', 'Limited', 'Exclusive'],
            aiScore: 0.92,
            reason: 'منتج نادر يناسب ذوقك الرفيع'
          }
        ];

        setRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Failed to generate AI recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [userId, currentProductId, category, viewedProducts, purchasedProducts]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // In real app, this would trigger different AI algorithms
  };

  if (loading) {
    return (
      <div className={`ai-recommendations ${className}`}>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: maxRecommendations }).map((_, index) => (
            <div key={index} className="product-card-skeleton">
              <Skeleton className="aspect-square rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-recommendations ${className}`} dir={language.direction}>
      {/* AI Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {t('aiPowered')}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('recommendedForYou')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('aiRecommendationsDesc')}
        </p>
      </div>

      {/* Recommendation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {Object.entries(recommendationAlgorithms).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === key
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {config.title}
          </button>
        ))}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product) => (
          <div
            key={product.id}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* AI Score Badge */}
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {(product.aiScore * 100).toFixed(0)}%
              </div>
            </div>

            {/* Product Image */}
            <div className="aspect-square overflow-hidden">
              <LazyImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {language.code === 'ar' ? product.name : product.nameEn}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.rating} ({product.reviews})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${product.price}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                    <span className="text-sm bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>

              {/* AI Reason */}
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-3 italic">
                🤖 {product.reason}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {product.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Add to Cart Button */}
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                {t('addToCart')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {recommendations.length >= maxRecommendations && (
        <div className="text-center mt-8">
          <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            {t('loadMoreRecommendations')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIProductRecommendations;