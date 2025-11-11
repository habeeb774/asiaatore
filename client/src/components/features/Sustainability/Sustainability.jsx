import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const SustainabilityContext = createContext();

export const useSustainability = () => {
  const context = useContext(SustainabilityContext);
  if (!context) {
    throw new Error('useSustainability must be used within a SustainabilityProvider');
  }
  return context;
};

export const SustainabilityProvider = ({ children }) => {
  const [ecoMetrics, setEcoMetrics] = useState({
    carbonFootprint: 0,
    treesPlanted: 0,
    wasteReduced: 0,
    energySaved: 0,
    waterConserved: 0
  });

  const [userImpact, setUserImpact] = useState({
    personalCarbonSavings: 0,
    treesPlantedByUser: 0,
    wasteDiverted: 0,
    sustainablePurchases: 0
  });

  const [ecoProducts, setEcoProducts] = useState([]);
  const [sustainabilityGoals, setSustainabilityGoals] = useState([]);
  const [ecoChallenges, setEcoChallenges] = useState([]);

  // Initialize with sample data
  useEffect(() => {
    const sampleEcoProducts = [
      {
        id: 1,
        name: 'Bamboo Toothbrush Set',
        category: 'Personal Care',
        price: 12.99,
        ecoRating: 95,
        certifications: ['FSC Certified', 'Biodegradable'],
        carbonFootprint: 0.5,
        materials: ['Bamboo', 'Natural Rubber'],
        impact: {
          co2Saved: 2.3,
          wasteReduced: 85,
          waterSaved: 10
        }
      },
      {
        id: 2,
        name: 'Organic Cotton T-Shirt',
        category: 'Fashion',
        price: 29.99,
        ecoRating: 88,
        certifications: ['GOTS Certified', 'Fair Trade'],
        carbonFootprint: 1.2,
        materials: ['Organic Cotton', 'Natural Dyes'],
        impact: {
          co2Saved: 5.1,
          wasteReduced: 60,
          waterSaved: 500
        }
      },
      {
        id: 3,
        name: 'Reusable Stainless Steel Bottle',
        category: 'Lifestyle',
        price: 24.99,
        ecoRating: 92,
        certifications: ['BPA Free', 'Recyclable'],
        carbonFootprint: 0.8,
        materials: ['Stainless Steel', 'Bamboo'],
        impact: {
          co2Saved: 8.7,
          wasteReduced: 95,
          waterSaved: 0
        }
      }
    ];

    const sampleGoals = [
      {
        id: 1,
        title: 'Zero Waste Week',
        titleAr: 'أسبوع بدون نفايات',
        description: 'Complete a week without generating plastic waste',
        descriptionAr: 'أكمل أسبوعاً بدون إنتاج نفايات بلاستيكية',
        progress: 60,
        target: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reward: 'Plant a tree in your name'
      },
      {
        id: 2,
        title: 'Carbon Neutral Month',
        titleAr: 'شهر محايد للكربون',
        description: 'Offset your carbon footprint for an entire month',
        descriptionAr: 'عوض بصمتك الكربونية لشهر كامل',
        progress: 30,
        target: 100,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reward: 'Exclusive eco-friendly product'
      }
    ];

    const sampleChallenges = [
      {
        id: 1,
        title: 'Plastic-Free Shopping',
        titleAr: 'تسوق بدون بلاستيك',
        description: 'Shop using reusable bags and containers',
        descriptionAr: 'تسوق باستخدام أكياس وأوعية قابلة للإعادة',
        participants: 1250,
        duration: 30,
        difficulty: 'Easy'
      },
      {
        id: 2,
        title: 'Sustainable Fashion Challenge',
        titleAr: 'تحدي الموضة المستدامة',
        description: 'Wear sustainable clothing for a month',
        descriptionAr: 'ارتدِ ملابس مستدامة لمدة شهر',
        participants: 890,
        duration: 30,
        difficulty: 'Medium'
      }
    ];

    setEcoProducts(sampleEcoProducts);
    setSustainabilityGoals(sampleGoals);
    setEcoChallenges(sampleChallenges);

    // Initialize user impact
    setUserImpact({
      personalCarbonSavings: 15.7,
      treesPlantedByUser: 3,
      wasteDiverted: 25.5,
      sustainablePurchases: 12
    });

    // Initialize eco metrics
    setEcoMetrics({
      carbonFootprint: 1250.5,
      treesPlanted: 150,
      wasteReduced: 850.2,
      energySaved: 12500,
      waterConserved: 50000
    });
  }, []);

  // Calculate product eco-impact
  const calculateProductImpact = (productId, quantity = 1) => {
    const product = ecoProducts.find(p => p.id === productId);
    if (!product) return null;

    return {
      co2Saved: product.impact.co2Saved * quantity,
      wasteReduced: product.impact.wasteReduced * quantity,
      waterSaved: product.impact.waterSaved * quantity
    };
  };

  // Update user impact
  const updateUserImpact = (action, data) => {
    switch (action) {
      case 'sustainable_purchase': {
        const impact = calculateProductImpact(data.productId, data.quantity);
        if (impact) {
          setUserImpact(prev => ({
            ...prev,
            personalCarbonSavings: prev.personalCarbonSavings + impact.co2Saved,
            wasteDiverted: prev.wasteDiverted + impact.wasteReduced,
            sustainablePurchases: prev.sustainablePurchases + data.quantity
          }));

          // Update global metrics
          setEcoMetrics(prev => ({
            ...prev,
            carbonFootprint: Math.max(0, prev.carbonFootprint - impact.co2Saved),
            wasteReduced: prev.wasteReduced + impact.wasteReduced,
            waterConserved: prev.waterConserved + impact.waterSaved
          }));
        }
        break;
      }
      case 'tree_planted': {
        setUserImpact(prev => ({
          ...prev,
          treesPlantedByUser: prev.treesPlantedByUser + data.count
        }));
        setEcoMetrics(prev => ({
          ...prev,
          treesPlanted: prev.treesPlanted + data.count
        }));
        break;
      }
    }
  };

  // Get eco-friendly recommendations
  const getEcoRecommendations = (category = null) => {
    let filtered = ecoProducts;
    if (category) {
      filtered = ecoProducts.filter(p => p.category === category);
    }
    return filtered.sort((a, b) => b.ecoRating - a.ecoRating);
  };

  // Calculate user's eco-score
  const calculateEcoScore = () => {
    const baseScore = 50; // Base score
    const purchaseBonus = userImpact.sustainablePurchases * 5;
    const carbonBonus = Math.floor(userImpact.personalCarbonSavings / 10);
    const treeBonus = userImpact.treesPlantedByUser * 10;

    return Math.min(100, baseScore + purchaseBonus + carbonBonus + treeBonus);
  };

  // Get sustainability badges
  const getSustainabilityBadges = () => {
    const badges = [];
    const score = calculateEcoScore();

    if (score >= 90) badges.push({ name: 'Eco Champion', icon: '🌱', color: 'green' });
    if (score >= 75) badges.push({ name: 'Green Warrior', icon: '🌿', color: 'teal' });
    if (score >= 60) badges.push({ name: 'Eco Conscious', icon: '♻️', color: 'blue' });
    if (userImpact.treesPlantedByUser >= 5) badges.push({ name: 'Tree Planter', icon: '🌳', color: 'brown' });
    if (userImpact.sustainablePurchases >= 10) badges.push({ name: 'Sustainable Shopper', icon: '🛍️', color: 'purple' });

    return badges;
  };

  const value = {
    ecoMetrics,
    userImpact,
    ecoProducts,
    sustainabilityGoals,
    ecoChallenges,
    calculateProductImpact,
    updateUserImpact,
    getEcoRecommendations,
    calculateEcoScore,
    getSustainabilityBadges
  };

  return (
    <SustainabilityContext.Provider value={value}>
      {children}
    </SustainabilityContext.Provider>
  );
};

const SustainabilityDashboard = ({ className = '' }) => {
  const {
    ecoMetrics,
    userImpact,
    ecoProducts,
    sustainabilityGoals,
    ecoChallenges,
    calculateEcoScore,
    getSustainabilityBadges
  } = useSustainability();

  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('impact');

  const tabs = [
    { id: 'impact', label: language.code === 'ar' ? 'التأثير' : 'Impact' },
    { id: 'products', label: language.code === 'ar' ? 'المنتجات' : 'Products' },
    { id: 'goals', label: language.code === 'ar' ? 'الأهداف' : 'Goals' },
    { id: 'challenges', label: language.code === 'ar' ? 'التحديات' : 'Challenges' }
  ];

  const ecoScore = calculateEcoScore();
  const badges = getSustainabilityBadges();

  return (
    <div className={`sustainability-dashboard ${className}`} dir={language.direction}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🌱 {language.code === 'ar' ? 'الاستدامة والبيئة' : 'Sustainability & Environment'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language.code === 'ar' ? 'نقاط الاستدامة' : 'Eco Score'}
              </div>
              <div className={`text-2xl font-bold ${
                ecoScore >= 80 ? 'text-green-600' :
                ecoScore >= 60 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {ecoScore}
              </div>
            </div>
            <div className="flex gap-1">
              {badges.slice(0, 3).map((badge, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-sm"
                  title={badge.name}
                >
                  {badge.icon}
                </div>
              ))}
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
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'impact' && (
            <div className="space-y-6">
              {/* Global Impact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🌍 {language.code === 'ar' ? 'التأثير العالمي' : 'Global Impact'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ImpactCard
                    icon="🌳"
                    value={ecoMetrics.treesPlanted}
                    label={language.code === 'ar' ? 'أشجار مزروعة' : 'Trees Planted'}
                    color="green"
                  />
                  <ImpactCard
                    icon="⚡"
                    value={`${ecoMetrics.energySaved.toLocaleString()} kWh`}
                    label={language.code === 'ar' ? 'طاقة محفوظة' : 'Energy Saved'}
                    color="yellow"
                  />
                  <ImpactCard
                    icon="💧"
                    value={`${ecoMetrics.waterConserved.toLocaleString()} L`}
                    label={language.code === 'ar' ? 'ماء محفوظ' : 'Water Saved'}
                    color="blue"
                  />
                  <ImpactCard
                    icon="♻️"
                    value={`${ecoMetrics.wasteReduced.toFixed(1)} kg`}
                    label={language.code === 'ar' ? 'نفايات مُعاد تدويرها' : 'Waste Recycled'}
                    color="purple"
                  />
                </div>
              </div>

              {/* Personal Impact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  👤 {language.code === 'ar' ? 'تأثيرك الشخصي' : 'Your Personal Impact'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ImpactCard
                    icon="🌱"
                    value={`${userImpact.personalCarbonSavings.toFixed(1)} kg`}
                    label={language.code === 'ar' ? 'كربون محفوظ' : 'CO₂ Saved'}
                    color="green"
                  />
                  <ImpactCard
                    icon="🌳"
                    value={userImpact.treesPlantedByUser}
                    label={language.code === 'ar' ? 'أشجار زرعتها' : 'Trees Planted'}
                    color="brown"
                  />
                  <ImpactCard
                    icon="🛍️"
                    value={userImpact.sustainablePurchases}
                    label={language.code === 'ar' ? 'مشتريات مستدامة' : 'Eco Purchases'}
                    color="teal"
                  />
                  <ImpactCard
                    icon="♻️"
                    value={`${userImpact.wasteDiverted.toFixed(1)} kg`}
                    label={language.code === 'ar' ? 'نفايات مُعاد تدويرها' : 'Waste Diverted'}
                    color="purple"
                  />
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🏆 {language.code === 'ar' ? 'شارات الاستدامة' : 'Sustainability Badges'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 px-4 py-2 rounded-full"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {language.code === 'ar' ? 'لا توجد شارات بعد. ابدأ رحلتك الخضراء!' : 'No badges yet. Start your green journey!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              {ecoProducts.map((product) => (
                <EcoProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              {sustainabilityGoals.map((goal) => (
                <SustainabilityGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-4">
              {ecoChallenges.map((challenge) => (
                <EcoChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImpactCard = ({ icon, value, label, color }) => {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-orange-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    brown: 'from-amber-600 to-yellow-700',
    teal: 'from-teal-500 to-green-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white p-4 rounded-lg text-center`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
};

const EcoProductCard = ({ product }) => {
  const { language } = useLanguage();

  return (
    <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          ♻️
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.category}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ${product.price}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language.code === 'ar' ? 'تقييم بيئي' : 'Eco Rating'}:
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {product.ecoRating}%
                </span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-wrap gap-2 mb-3">
            {product.certifications.map((cert, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full"
              >
                {cert}
              </span>
            ))}
          </div>

          {/* Impact */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600 dark:text-green-400">
                {product.impact.co2Saved}kg
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {language.code === 'ar' ? 'كربون محفوظ' : 'CO₂ Saved'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600 dark:text-blue-400">
                {product.impact.wasteReduced}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {language.code === 'ar' ? 'نفايات مُعاد تدويرها' : 'Waste Reduced'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-cyan-600 dark:text-cyan-400">
                {product.impact.waterSaved}L
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {language.code === 'ar' ? 'ماء محفوظ' : 'Water Saved'}
              </div>
            </div>
          </div>

          <button className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            {language.code === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SustainabilityGoalCard = ({ goal }) => {
  const { language } = useLanguage();

  const progressPercent = (goal.progress / goal.target) * 100;
  const daysLeft = Math.ceil((goal.deadline - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language.code === 'ar' ? goal.titleAr || goal.title : goal.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {language.code === 'ar' ? goal.descriptionAr || goal.description : goal.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {daysLeft} {language.code === 'ar' ? 'يوم متبقي' : 'days left'}
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {goal.progress}%
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {language.code === 'ar' ? 'المكافأة' : 'Reward'}: {goal.reward}
        </span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          {language.code === 'ar' ? 'تحديث التقدم' : 'Update Progress'}
        </button>
      </div>
    </div>
  );
};

const EcoChallengeCard = ({ challenge }) => {
  const { language } = useLanguage();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language.code === 'ar' ? challenge.titleAr || challenge.title : challenge.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {language.code === 'ar' ? challenge.descriptionAr || challenge.description : challenge.description}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
          {challenge.difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-400">
            👥 {challenge.participants.toLocaleString()} {language.code === 'ar' ? 'مشارك' : 'participants'}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            ⏱️ {challenge.duration} {language.code === 'ar' ? 'يوم' : 'days'}
          </span>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
          {language.code === 'ar' ? 'انضم للتحدي' : 'Join Challenge'}
        </button>
      </div>
    </div>
  );
};

export { SustainabilityDashboard };