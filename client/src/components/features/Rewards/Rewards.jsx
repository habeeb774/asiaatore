import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const RewardsContext = createContext();

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};

export const RewardsProvider = ({ children }) => {
  const [userPoints, setUserPoints] = useState(150); // Starting points for demo
  const [rewards, setRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);

  // Reward catalog
  const rewardCatalog = useMemo(() => [
    {
      id: 'discount_10',
      type: 'discount',
      title: 'خصم 10%',
      titleEn: '10% Discount',
      description: 'خصم 10% على الشراء التالي',
      descriptionEn: '10% off your next purchase',
      icon: '💰',
      cost: 50,
      value: 10,
      category: 'discount',
      available: true,
      maxPerUser: 5
    },
    {
      id: 'free_shipping',
      type: 'shipping',
      title: 'شحن مجاني',
      titleEn: 'Free Shipping',
      description: 'شحن مجاني على طلب واحد',
      descriptionEn: 'Free shipping on one order',
      icon: '🚚',
      cost: 75,
      value: null,
      category: 'shipping',
      available: true,
      maxPerUser: 3
    },
    {
      id: 'bonus_points',
      type: 'points',
      title: 'نقاط إضافية',
      titleEn: 'Bonus Points',
      description: 'احصل على 25 نقطة إضافية',
      descriptionEn: 'Get 25 bonus points',
      icon: '⭐',
      cost: 100,
      value: 25,
      category: 'points',
      available: true,
      maxPerUser: 10
    },
    {
      id: 'exclusive_access',
      type: 'access',
      title: 'وصول حصري',
      titleEn: 'Exclusive Access',
      description: 'وصول مبكر للمنتجات الجديدة',
      descriptionEn: 'Early access to new products',
      icon: '🔓',
      cost: 200,
      value: null,
      category: 'access',
      available: true,
      maxPerUser: 1
    },
    {
      id: 'personalized_gift',
      type: 'gift',
      title: 'هدية مخصصة',
      titleEn: 'Personalized Gift',
      description: 'هدية مخصصة من اختيارك',
      descriptionEn: 'Personalized gift of your choice',
      icon: '🎁',
      cost: 300,
      value: null,
      category: 'gift',
      available: true,
      maxPerUser: 1
    },
    {
      id: 'vip_support',
      type: 'support',
      title: 'دعم VIP',
      titleEn: 'VIP Support',
      description: 'دعم فني ذو أولوية عالية',
      descriptionEn: 'Priority technical support',
      icon: '👑',
      cost: 150,
      value: null,
      category: 'support',
      available: true,
      maxPerUser: 2
    }
  ], []);

  // Initialize rewards
  useEffect(() => {
    setRewards(rewardCatalog);
  }, [rewardCatalog]);

  // Redeem reward
  const redeemReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !reward.available || userPoints < reward.cost) {
      return { success: false, message: 'Insufficient points or reward unavailable' };
    }

    // Check max per user
    const userRedemptions = redemptionHistory.filter(r => r.rewardId === rewardId).length;
    if (userRedemptions >= reward.maxPerUser) {
      return { success: false, message: 'Maximum redemptions reached' };
    }

    // Deduct points
    setUserPoints(prev => prev - reward.cost);

    // Add to user rewards
    const redemption = {
      id: Date.now(),
      rewardId,
      redeemedAt: new Date(),
      status: 'active',
      code: generateRewardCode(reward.type)
    };

    setUserRewards(prev => [...prev, redemption]);
    setRedemptionHistory(prev => [...prev, redemption]);

    return {
      success: true,
      message: 'Reward redeemed successfully!',
      code: redemption.code
    };
  };

  // Generate reward code
  const generateRewardCode = (type) => {
    const prefix = type === 'discount' ? 'DISC' :
                   type === 'shipping' ? 'SHIP' :
                   type === 'points' ? 'PTS' :
                   type === 'access' ? 'VIP' :
                   type === 'gift' ? 'GIFT' : 'SUPP';
    return `${prefix}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  };

  // Get available rewards
  const getAvailableRewards = () => {
    return rewards.filter(reward => {
      const userRedemptions = redemptionHistory.filter(r => r.rewardId === reward.id).length;
      return reward.available && userRedemptions < reward.maxPerUser;
    });
  };

  // Get user active rewards
  const getActiveRewards = () => {
    return userRewards.filter(reward => reward.status === 'active');
  };

  // Get redemption history
  const getRedemptionHistory = () => {
    return redemptionHistory.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
  };

  // Use reward
  const useReward = (rewardId) => {
    setUserRewards(prev => prev.map(reward =>
      reward.id === rewardId ? { ...reward, status: 'used' } : reward
    ));
  };

  // Get points needed for next reward tier
  const getNextRewardTier = () => {
    const affordableRewards = rewards.filter(r => r.cost <= userPoints);
    if (affordableRewards.length === 0) {
      const cheapest = rewards.reduce((min, r) => r.cost < min.cost ? r : min);
      return { pointsNeeded: cheapest.cost - userPoints, reward: cheapest };
    }
    return null;
  };

  const value = {
    userPoints,
    rewards: getAvailableRewards(),
    userRewards: getActiveRewards(),
    redemptionHistory: getRedemptionHistory(),
    redeemReward,
    useReward,
    getNextRewardTier,
    setUserPoints // For testing/demo purposes
  };

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
};

const RewardsModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const {
    userPoints,
    rewards,
    userRewards,
    redemptionHistory,
    redeemReward,
    getNextRewardTier
  } = useRewards();

  const [activeTab, setActiveTab] = useState('rewards');
  const [redemptionMessage, setRedemptionMessage] = useState(null);

  const tabs = [
    { id: 'rewards', label: t('rewards') || 'Rewards' },
    { id: 'myRewards', label: t('myRewards') || 'My Rewards', count: userRewards.length },
    { id: 'history', label: t('history') || 'History' }
  ];

  const handleRedeem = (rewardId) => {
    const result = redeemReward(rewardId);
    setRedemptionMessage(result);

    setTimeout(() => setRedemptionMessage(null), 5000);
  };

  const nextTier = getNextRewardTier();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="rewards-modal" dir={language.direction}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('rewards') || 'Rewards Store'}
            </h2>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('availablePoints') || 'Available Points'}
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userPoints}
              </div>
            </div>
          </div>

          {/* Redemption Message */}
          {redemptionMessage && (
            <div className={`p-4 rounded-lg mb-4 ${
              redemptionMessage.success
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {redemptionMessage.success ? '✅' : '❌'}
                </span>
                <span>{redemptionMessage.message}</span>
              </div>
              {redemptionMessage.success && redemptionMessage.code && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm">
                  {t('rewardCode') || 'Reward Code'}: {redemptionMessage.code}
                </div>
              )}
            </div>
          )}

          {/* Next Reward Hint */}
          {nextTier && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <span>💡</span>
                <span className="font-medium">
                  {language.code === 'ar'
                    ? `احتاج ${nextTier.pointsNeeded} نقطة أخرى للحصول على ${nextTier.reward.title}`
                    : `Need ${nextTier.pointsNeeded} more points for ${nextTier.reward.titleEn}`
                  }
                </span>
              </div>
            </div>
          )}

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
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'rewards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userPoints}
                    onRedeem={handleRedeem}
                  />
                ))}
              </div>
            )}

            {activeTab === 'myRewards' && (
              <div className="space-y-4">
                {userRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎁</div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noActiveRewards') || 'No active rewards yet. Redeem some points to get started!'}
                    </p>
                  </div>
                ) : (
                  userRewards.map((userReward) => {
                    const reward = rewards.find(r => r.id === userReward.rewardId);
                    return (
                      <div key={userReward.id} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{reward?.icon}</span>
                            <div>
                              <h3 className="font-medium text-green-800 dark:text-green-200">
                                {language.code === 'ar' ? reward?.title : reward?.titleEn}
                              </h3>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {t('code') || 'Code'}: {userReward.code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-600 dark:text-green-400">
                              {t('redeemed') || 'Redeemed'} {new Date(userReward.redeemedAt).toLocaleDateString()}
                            </div>
                            <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                              {t('useReward') || 'Use Reward'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {redemptionHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📜</div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noRedemptionHistory') || 'No redemption history yet.'}
                    </p>
                  </div>
                ) : (
                  redemptionHistory.map((item) => {
                    const reward = rewards.find(r => r.id === item.rewardId);
                    return (
                      <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{reward?.icon}</span>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {language.code === 'ar' ? reward?.title : reward?.titleEn}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('code') || 'Code'}: {item.code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(item.redeemedAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              -{reward?.cost} {t('points') || 'points'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const RewardCard = ({ reward, userPoints, onRedeem }) => {
  const { language } = useLanguage();
  const canAfford = userPoints >= reward.cost;

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      canAfford
        ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-300'
        : 'border-gray-200 bg-gray-50 dark:bg-gray-800 opacity-60'
    }`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{reward.icon}</div>

        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-1 ${
            canAfford ? 'text-gray-900 dark:text-white' : 'text-gray-500'
          }`}>
            {language.code === 'ar' ? reward.title : reward.titleEn}
          </h3>

          <p className={`text-sm mb-3 ${
            canAfford ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'
          }`}>
            {language.code === 'ar' ? reward.description : reward.descriptionEn}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                canAfford ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
              }`}>
                {reward.cost}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {language.code === 'ar' ? 'نقطة' : 'points'}
              </span>
            </div>

            <button
              onClick={() => onRedeem(reward.id)}
              disabled={!canAfford}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              {language.code === 'ar' ? 'استبدال' : 'Redeem'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RewardsWidget = ({ className = '' }) => {
  const { userPoints, rewards } = useRewards();
  const [showModal, setShowModal] = useState(false);

  const affordableRewards = rewards.filter(r => r.cost <= userPoints).length;

  return (
    <>
      <div
        className={`rewards-widget cursor-pointer ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <span className="font-semibold">Rewards</span>
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
              {userPoints} pts
            </span>
          </div>

          <p className="text-sm opacity-90">
            {affordableRewards} {affordableRewards === 1 ? 'reward' : 'rewards'} available
          </p>
        </div>
      </div>

      <RewardsModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export { RewardsModal, RewardsWidget };