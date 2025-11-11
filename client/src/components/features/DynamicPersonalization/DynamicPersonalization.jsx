import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const PersonalizationContext = createContext();

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};

export const PersonalizationProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    preferences: {
      categories: [],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      colors: [],
      sizes: [],
      style: 'modern'
    },
    behavior: {
      viewedProducts: [],
      purchasedProducts: [],
      searchHistory: [],
      cartItems: [],
      wishlistedItems: []
    },
    demographics: {
      age: null,
      gender: null,
      location: null,
      deviceType: 'desktop'
    }
  });

  const [personalizedContent, setPersonalizedContent] = useState({
    recommendations: [],
    trendingForYou: [],
    similarToViewed: [],
    priceAlerts: [],
    restockAlerts: []
  });

  const [aiInsights, setAiInsights] = useState({
    shoppingPatterns: [],
    preferredTimes: [],
    budgetRange: null,
    loyaltyTier: 'bronze'
  });

  // Initialize with sample data
  useEffect(() => {
    // Simulate user behavior data
    const sampleBehavior = {
      viewedProducts: [101, 102, 103, 201, 202],
      purchasedProducts: [101, 201],
      searchHistory: ['wireless headphones', 'smart watch', 'designer dress', 'running shoes'],
      cartItems: [102],
      wishlistedItems: [103, 202]
    };

    const samplePreferences = {
      categories: ['Electronics', 'Fashion', 'Sports'],
      priceRange: { min: 50, max: 300 },
      brands: ['TechCorp', 'FashionHub'],
      colors: ['black', 'blue', 'red'],
      sizes: ['M', 'L'],
      style: 'modern'
    };

    setUserProfile({
      preferences: samplePreferences,
      behavior: sampleBehavior,
      demographics: {
        age: 28,
        gender: 'male',
        location: 'Riyadh',
        deviceType: 'mobile'
      }
    });

    // Generate personalized content
    setPersonalizedContent(generatePersonalizedContent(sampleBehavior, samplePreferences));
    setAiInsights(generateAIInsights(sampleBehavior));
  }, []);

  // Generate personalized recommendations
  const generatePersonalizedContent = (behavior, preferences) => { // eslint-disable-line no-unused-vars
    // Simulate AI-driven personalization
    const recommendations = [
      {
        id: 301,
        name: 'Premium Wireless Earbuds',
        category: 'Electronics',
        price: 149.99,
        reason: 'Based on your interest in wireless headphones',
        confidence: 92,
        type: 'similar_to_purchased'
      },
      {
        id: 302,
        name: 'Smart Fitness Watch',
        category: 'Sports',
        price: 199.99,
        reason: 'Matches your active lifestyle and tech preferences',
        confidence: 88,
        type: 'behavior_based'
      },
      {
        id: 303,
        name: 'Casual Blazer',
        category: 'Fashion',
        price: 89.99,
        reason: 'Trending in your preferred style and price range',
        confidence: 85,
        type: 'trend_based'
      }
    ];

    const trendingForYou = [
      { id: 401, name: 'Gaming Mouse', trend: '🔥 Hot', reason: 'Popular among tech enthusiasts' },
      { id: 402, name: 'Yoga Mat', trend: '📈 Rising', reason: 'Matches your fitness interests' }
    ];

    const similarToViewed = [
      { id: 501, name: 'Bluetooth Speaker', similarity: 85, reason: 'Similar to viewed headphones' },
      { id: 502, name: 'Sport Headphones', similarity: 78, reason: 'Alternative to your viewed items' }
    ];

    return {
      recommendations,
      trendingForYou,
      similarToViewed,
      priceAlerts: [],
      restockAlerts: []
    };
  };

  // Generate AI insights
  const generateAIInsights = (behavior) => { // eslint-disable-line no-unused-vars
    return {
      shoppingPatterns: [
        'Prefers shopping on weekends',
        'Often buys electronics and fashion items',
        'Typically spends $100-300 per purchase',
        'Loyal to certain brands'
      ],
      preferredTimes: ['Saturday 2-4 PM', 'Sunday 10 AM-12 PM'],
      budgetRange: { min: 50, max: 300 },
      loyaltyTier: 'silver'
    };
  };

  // Update user preferences
  const updatePreferences = (newPreferences) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...newPreferences }
    }));

    // Regenerate personalized content
    setPersonalizedContent(generatePersonalizedContent(
      userProfile.behavior,
      { ...userProfile.preferences, ...newPreferences }
    ));
  };

  // Track user behavior
  const trackBehavior = (action, data) => {
    switch (action) {
      case 'view_product':
        setUserProfile(prev => ({
          ...prev,
          behavior: {
            ...prev.behavior,
            viewedProducts: [...new Set([...prev.behavior.viewedProducts, data.productId])]
          }
        }));
        break;
      case 'add_to_cart':
        setUserProfile(prev => ({
          ...prev,
          behavior: {
            ...prev.behavior,
            cartItems: [...new Set([...prev.behavior.cartItems, data.productId])]
          }
        }));
        break;
      case 'purchase':
        setUserProfile(prev => ({
          ...prev,
          behavior: {
            ...prev.behavior,
            purchasedProducts: [...new Set([...prev.behavior.purchasedProducts, data.productId])]
          }
        }));
        break;
      case 'search':
        setUserProfile(prev => ({
          ...prev,
          behavior: {
            ...prev.behavior,
            searchHistory: [...new Set([...prev.behavior.searchHistory, data.query])]
          }
        }));
        break;
    }

    // Update personalized content based on new behavior
    setTimeout(() => {
      setPersonalizedContent(generatePersonalizedContent(userProfile.behavior, userProfile.preferences));
    }, 100);
  };

  // Get personalized recommendations
  const getPersonalizedRecommendations = (type = 'all', limit = 10) => {
    switch (type) {
      case 'similar':
        return personalizedContent.similarToViewed.slice(0, limit);
      case 'trending':
        return personalizedContent.trendingForYou.slice(0, limit);
      case 'behavior':
        return personalizedContent.recommendations.filter(r => r.type === 'behavior_based').slice(0, limit);
      default:
        return personalizedContent.recommendations.slice(0, limit);
    }
  };

  // Get user insights
  const getUserInsights = () => {
    return {
      ...aiInsights,
      preferences: userProfile.preferences,
      behavior: {
        totalViews: userProfile.behavior.viewedProducts.length,
        totalPurchases: userProfile.behavior.purchasedProducts.length,
        favoriteCategories: getFavoriteCategories(),
        averageOrderValue: calculateAverageOrderValue()
      }
    };
  };

  // Helper functions
  const getFavoriteCategories = () => {
    // Simplified category analysis
    return userProfile.preferences.categories;
  };

  const calculateAverageOrderValue = () => {
    // Simplified calculation
    return 175.50;
  };

  const value = {
    userProfile,
    personalizedContent,
    aiInsights,
    updatePreferences,
    trackBehavior,
    getPersonalizedRecommendations,
    getUserInsights
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
};

const PersonalizationDashboard = ({ className = '' }) => {
  const {
    userProfile,
    personalizedContent,
    aiInsights,
    updatePreferences,
    getUserInsights
  } = usePersonalization();

  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('recommendations');

  const tabs = [
    { id: 'recommendations', label: language.code === 'ar' ? 'التوصيات' : 'Recommendations' },
    { id: 'insights', label: language.code === 'ar' ? 'الرؤى' : 'Insights' },
    { id: 'preferences', label: language.code === 'ar' ? 'التفضيلات' : 'Preferences' },
    { id: 'behavior', label: language.code === 'ar' ? 'السلوك' : 'Behavior' }
  ];

  const insights = getUserInsights();

  return (
    <div className={`personalization-dashboard ${className}`} dir={language.direction}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language.code === 'ar' ? 'التخصيص الديناميكي' : 'Dynamic Personalization'}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              aiInsights.loyaltyTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
              aiInsights.loyaltyTier === 'silver' ? 'bg-gray-100 text-gray-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {aiInsights.loyaltyTier.toUpperCase()} {language.code === 'ar' ? 'عضو' : 'Member'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Personalized Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'مخصص لك' : 'Personalized for You'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalizedContent.recommendations.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Trending for You */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'رائج بالنسبة لك' : 'Trending for You'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalizedContent.trendingForYou.map((item) => (
                    <TrendingCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* AI Insights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🤖 {language.code === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {language.code === 'ar' ? 'أنماط التسوق' : 'Shopping Patterns'}
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {aiInsights.shoppingPatterns.map((pattern, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {language.code === 'ar' ? 'أوقات التسوق المفضلة' : 'Preferred Shopping Times'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {aiInsights.preferredTimes.map((time, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavior Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📊 {language.code === 'ar' ? 'إحصائيات السلوك' : 'Behavior Statistics'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {insights.behavior.totalViews}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language.code === 'ar' ? 'المشاهدات' : 'Views'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {insights.behavior.totalPurchases}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language.code === 'ar' ? 'المشتريات' : 'Purchases'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${insights.behavior.averageOrderValue}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language.code === 'ar' ? 'متوسط الطلب' : 'Avg Order'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {insights.behavior.favoriteCategories.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language.code === 'ar' ? 'الفئات المفضلة' : 'Fav Categories'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <PreferencesEditor preferences={userProfile.preferences} onUpdate={updatePreferences} />
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
                </h3>
                <div className="space-y-3">
                  {userProfile.behavior.viewedProducts.slice(-5).map((productId, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        👁️
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {language.code === 'ar' ? 'عرض منتج' : 'Viewed product'} #{productId}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(Date.now() - index * 3600000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'تاريخ البحث' : 'Search History'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.behavior.searchHistory.map((query, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {query}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ item }) => {
  const { language } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
          {item.id}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {item.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {item.reason}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-green-600 dark:text-green-400">
              ${item.price}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${item.confidence}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.confidence}%
              </span>
            </div>
          </div>
          <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            {language.code === 'ar' ? 'عرض المنتج' : 'View Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TrendingCard = ({ item }) => {
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
        🔥
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {item.name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {item.reason}
        </p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
          {item.trend}
        </div>
        <button className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          {language.code === 'ar' ? 'عرض' : 'View'}
        </button>
      </div>
    </div>
  );
};

const PreferencesEditor = ({ preferences, onUpdate }) => {
  const { language } = useLanguage();
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const categories = ['Electronics', 'Fashion', 'Sports', 'Home', 'Beauty', 'Books'];
  const brands = ['TechCorp', 'FashionHub', 'SportMax', 'HomeStyle', 'BeautyPlus'];
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const styles = ['modern', 'classic', 'minimalist', 'vintage', 'sporty'];

  const handleSave = () => {
    onUpdate(tempPreferences);
  };

  const toggleArrayItem = (key, value) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'الفئات المفضلة' : 'Preferred Categories'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleArrayItem('categories', category)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tempPreferences.categories.includes(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'نطاق السعر' : 'Price Range'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              {language.code === 'ar' ? 'الحد الأدنى' : 'Minimum'}
            </label>
            <input
              type="number"
              value={tempPreferences.priceRange.min}
              onChange={(e) => setTempPreferences(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, min: Number(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              {language.code === 'ar' ? 'الحد الأقصى' : 'Maximum'}
            </label>
            <input
              type="number"
              value={tempPreferences.priceRange.max}
              onChange={(e) => setTempPreferences(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, max: Number(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'العلامات التجارية المفضلة' : 'Preferred Brands'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => toggleArrayItem('brands', brand)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tempPreferences.brands.includes(brand)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'الألوان المفضلة' : 'Preferred Colors'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => toggleArrayItem('colors', color)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tempPreferences.colors.includes(color)
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'الأحجام المفضلة' : 'Preferred Sizes'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleArrayItem('sizes', size)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tempPreferences.sizes.includes(size)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {language.code === 'ar' ? 'الأسلوب المفضل' : 'Preferred Style'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => setTempPreferences(prev => ({ ...prev, style }))}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tempPreferences.style === style
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {language.code === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export { PersonalizationDashboard };