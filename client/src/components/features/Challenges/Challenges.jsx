import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const ChallengesContext = createContext();

export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
};

export const ChallengesProvider = ({ children }) => {
  const [challenges, setChallenges] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [activeChallenges, setActiveChallenges] = useState([]);

  // Challenge definitions
  const challengeTemplates = [
    {
      id: 'daily_login',
      type: 'daily',
      title: 'تسجيل الدخول اليومي',
      titleEn: 'Daily Login',
      description: 'سجل دخولك كل يوم لمدة أسبوع',
      descriptionEn: 'Log in every day for a week',
      icon: '📅',
      duration: 7,
      reward: { xp: 50, points: 10 },
      requirements: { logins: 7 }
    },
    {
      id: 'shopping_spree',
      type: 'seasonal',
      title: 'جولة تسوق مجنونة',
      titleEn: 'Shopping Spree',
      description: 'اشترِ 5 منتجات مختلفة في أسبوع واحد',
      descriptionEn: 'Buy 5 different products in one week',
      icon: '🛍️',
      duration: 7,
      reward: { xp: 100, points: 25 },
      requirements: { purchases: 5, uniqueProducts: true }
    },
    {
      id: 'review_champion',
      type: 'achievement',
      title: 'بطل المراجعات',
      titleEn: 'Review Champion',
      description: 'اكتب مراجعات مفصلة لـ3 منتجات',
      descriptionEn: 'Write detailed reviews for 3 products',
      icon: '✍️',
      duration: null,
      reward: { xp: 75, points: 15 },
      requirements: { reviews: 3, detailed: true }
    },
    {
      id: 'social_sharer',
      type: 'social',
      title: 'المشارك الاجتماعي',
      titleEn: 'Social Sharer',
      description: 'شارك 3 منتجات على وسائل التواصل',
      descriptionEn: 'Share 3 products on social media',
      icon: '📱',
      duration: null,
      reward: { xp: 60, points: 12 },
      requirements: { shares: 3 }
    },
    {
      id: 'loyalty_milestone',
      type: 'milestone',
      title: 'معلم الولاء',
      titleEn: 'Loyalty Milestone',
      description: 'أكمل 10 عمليات شراء',
      descriptionEn: 'Complete 10 purchases',
      icon: '🎯',
      duration: null,
      reward: { xp: 200, points: 50 },
      requirements: { purchases: 10 }
    }
  ];

  // Initialize challenges
  useEffect(() => {
    const now = new Date();
    const initializedChallenges = challengeTemplates.map(template => ({
      ...template,
      id: `${template.id}_${now.getTime()}`,
      startDate: now,
      endDate: template.duration ? new Date(now.getTime() + template.duration * 24 * 60 * 60 * 1000) : null,
      progress: 0,
      completed: false,
      claimed: false
    }));

    setChallenges(initializedChallenges);
    setActiveChallenges(initializedChallenges.filter(c => !c.completed));
  }, [challengeTemplates]);

  // Update challenge progress
  const updateProgress = (challengeId, action, data = {}) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id !== challengeId) return challenge;

      let newProgress = challenge.progress;

      switch (action) {
        case 'login':
          if (challenge.id.includes('daily_login')) newProgress++;
          break;
        case 'purchase':
          if (challenge.id.includes('shopping_spree') || challenge.id.includes('loyalty_milestone')) {
            newProgress++;
          }
          break;
        case 'review':
          if (challenge.id.includes('review_champion')) newProgress++;
          break;
        case 'share':
          if (challenge.id.includes('social_sharer')) newProgress++;
          break;
      }

      const completed = newProgress >= getRequiredCount(challenge);
      const updatedChallenge = { ...challenge, progress: newProgress, completed };

      if (completed && !challenge.completed) {
        // Trigger completion celebration
        onChallengeCompleted(updatedChallenge);
      }

      return updatedChallenge;
    }));
  };

  // Get required count for challenge
  const getRequiredCount = (challenge) => {
    if (challenge.requirements) {
      return challenge.requirements.logins ||
             challenge.requirements.purchases ||
             challenge.requirements.reviews ||
             challenge.requirements.shares || 1;
    }
    return 1;
  };

  // Handle challenge completion
  const onChallengeCompleted = (challenge) => {
    // Could trigger notifications, animations, etc.
    console.log('Challenge completed:', challenge.title);
  };

  // Claim reward
  const claimReward = (challengeId) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId && challenge.completed && !challenge.claimed) {
        return { ...challenge, claimed: true };
      }
      return challenge;
    }));

    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge && challenge.reward) {
      // Here you would integrate with gamification system
      return challenge.reward;
    }
    return null;
  };

  // Get active challenges
  const getActiveChallenges = () => {
    return challenges.filter(c => !c.completed);
  };

  // Get completed challenges
  const getCompletedChallenges = () => {
    return challenges.filter(c => c.completed && !c.claimed);
  };

  // Get claimed challenges
  const getClaimedChallenges = () => {
    return challenges.filter(c => c.claimed);
  };

  const value = {
    challenges,
    activeChallenges: getActiveChallenges(),
    completedChallenges: getCompletedChallenges(),
    claimedChallenges: getClaimedChallenges(),
    updateProgress,
    claimReward,
    getRequiredCount
  };

  return (
    <ChallengesContext.Provider value={value}>
      {children}
    </ChallengesContext.Provider>
  );
};

const ChallengesModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const {
    activeChallenges,
    completedChallenges,
    claimedChallenges,
    claimReward,
    getRequiredCount
  } = useChallenges();

  const [activeTab, setActiveTab] = useState('active');

  const tabs = [
    { id: 'active', label: t('active') || 'Active', count: activeChallenges.length },
    { id: 'completed', label: t('completed') || 'Completed', count: completedChallenges.length },
    { id: 'claimed', label: t('claimed') || 'Claimed', count: claimedChallenges.length }
  ];

  const getCurrentChallenges = () => {
    switch (activeTab) {
      case 'active': return activeChallenges;
      case 'completed': return completedChallenges;
      case 'claimed': return claimedChallenges;
      default: return activeChallenges;
    }
  };

  const handleClaimReward = (challengeId) => {
    const reward = claimReward(challengeId);
    if (reward) {
      // Show success message
      console.log('Reward claimed:', reward);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="challenges-modal" dir={language.direction}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('challenges') || 'Challenges & Quests'}
          </h2>

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
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Challenges List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getCurrentChallenges().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'active' && (t('noActiveChallenges') || 'No active challenges right now.')}
                  {activeTab === 'completed' && (t('noCompletedChallenges') || 'No completed challenges to claim.')}
                  {activeTab === 'claimed' && (t('noClaimedChallenges') || 'No claimed challenges yet.')}
                </p>
              </div>
            ) : (
              getCurrentChallenges().map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onClaim={handleClaimReward}
                  requiredCount={getRequiredCount(challenge)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const ChallengeCard = ({ challenge, onClaim, requiredCount }) => {
  const { language } = useLanguage();

  const progressPercent = (challenge.progress / requiredCount) * 100;
  const isCompleted = challenge.completed;
  const isClaimed = challenge.claimed;

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isClaimed
        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
        : isCompleted
        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl ${isCompleted ? '' : 'grayscale opacity-50'}`}>
          {challenge.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className={`font-semibold text-lg ${
                isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {language.code === 'ar' ? challenge.title : challenge.titleEn}
              </h3>
              <p className={`text-sm ${
                isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500'
              }`}>
                {language.code === 'ar' ? challenge.description : challenge.descriptionEn}
              </p>
            </div>

            {isCompleted && !isClaimed && (
              <button
                onClick={() => onClaim(challenge.id)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                {language.code === 'ar' ? 'استلام المكافأة' : 'Claim Reward'}
              </button>
            )}

            {isClaimed && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{language.code === 'ar' ? 'مستلم' : 'Claimed'}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{language.code === 'ar' ? 'التقدم' : 'Progress'}</span>
              <span>{challenge.progress} / {requiredCount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-gradient-to-r from-green-500 to-teal-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Reward Display */}
          {challenge.reward && (
            <div className="flex gap-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                +{challenge.reward.xp} XP
              </span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                +{challenge.reward.points} {language.code === 'ar' ? 'نقاط' : 'points'}
              </span>
            </div>
          )}

          {/* Time Remaining */}
          {challenge.endDate && !isCompleted && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {language.code === 'ar' ? 'ينتهي في:' : 'Ends in:'} {Math.ceil((challenge.endDate - new Date()) / (1000 * 60 * 60 * 24))} {language.code === 'ar' ? 'يوم' : 'days'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChallengesWidget = ({ className = '' }) => {
  const { activeChallenges, completedChallenges } = useChallenges();
  const [showModal, setShowModal] = useState(false);

  const totalChallenges = activeChallenges.length + completedChallenges.length;
  const completionRate = totalChallenges > 0 ? (completedChallenges.length / totalChallenges) * 100 : 0;

  return (
    <>
      <div
        className={`challenges-widget cursor-pointer ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold">Challenges</span>
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
              {completedChallenges.length}/{totalChallenges}
            </span>
          </div>

          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <p className="text-sm opacity-90">
            {activeChallenges.length} active • {completedChallenges.length} completed
          </p>
        </div>
      </div>

      <ChallengesModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export { ChallengesModal, ChallengesWidget };