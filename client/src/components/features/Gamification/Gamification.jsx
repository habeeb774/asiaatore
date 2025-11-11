import React, { useState, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    points: 0,
    badges: [],
    streak: 0,
    achievements: []
  });

  const [notifications, setNotifications] = useState([]);

  // XP requirements for levels
  const xpForLevel = (level) => level * 100;

  // Achievement definitions
  const achievements = [
    {
      id: 'first_purchase',
      title: 'أول شراء',
      titleEn: 'First Purchase',
      description: 'أكمل أول عملية شراء',
      descriptionEn: 'Complete your first purchase',
      icon: '🛒',
      xp: 50,
      points: 10
    },
    {
      id: 'review_master',
      title: 'خبير المراجعات',
      titleEn: 'Review Master',
      description: 'اكتب 10 مراجعات',
      descriptionEn: 'Write 10 reviews',
      icon: '⭐',
      xp: 100,
      points: 25
    },
    {
      id: 'loyal_customer',
      title: 'عميل مخلص',
      titleEn: 'Loyal Customer',
      description: 'اشترِ 50 مرة',
      descriptionEn: 'Make 50 purchases',
      icon: '💎',
      xp: 500,
      points: 100
    }
  ];

  // Add XP and check for level up
  const addXP = (amount, reason) => {
    setUserStats(prev => {
      const newXP = prev.xp + amount;
      let newLevel = prev.level;
      let leveledUp = false;

      while (newXP >= xpForLevel(newLevel + 1)) {
        newLevel++;
        leveledUp = true;
      }

      if (leveledUp) {
        showNotification(`🎉 ${reason === 'ar' ? 'ترقية!' : 'Level Up!'} ${reason === 'ar' ? 'وصلت للمستوى' : 'Reached Level'} ${newLevel}!`, 'level_up');
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel
      };
    });
  };

  // Add points
  const addPoints = (amount, reason) => {
    setUserStats(prev => ({ ...prev, points: prev.points + amount }));
    showNotification(`💰 +${amount} ${reason === 'ar' ? 'نقاط' : 'points'}!`, 'points');
  };

  // Award badge
  const awardBadge = (badgeId) => {
    const badge = achievements.find(a => a.id === badgeId);
    if (!badge || userStats.badges.includes(badgeId)) return;

    setUserStats(prev => ({
      ...prev,
      badges: [...prev.badges, badgeId],
      xp: prev.xp + badge.xp,
      points: prev.points + badge.points
    }));

    showNotification(`🏆 ${badge.title}!`, 'badge');
  };

  // Show notification
  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Track user actions
  const trackAction = (action, data = {}) => {
    switch (action) {
      case 'purchase':
        addXP(20, 'شراء');
        addPoints(5, 'شراء');
        break;
      case 'review':
        addXP(10, 'مراجعة');
        addPoints(2, 'مراجعة');
        break;
      case 'login_streak':
        setUserStats(prev => ({ ...prev, streak: prev.streak + 1 }));
        if (userStats.streak > 0 && userStats.streak % 7 === 0) {
          addPoints(20, 'سلسلة تسجيل دخول');
        }
        break;
      case 'share':
        addXP(5, 'مشاركة');
        addPoints(1, 'مشاركة');
        break;
      case 'referral':
        addXP(50, 'إحالة');
        addPoints(10, 'إحالة');
        break;
    }
  };

  const value = {
    userStats,
    achievements,
    notifications,
    addXP,
    addPoints,
    awardBadge,
    trackAction,
    xpForLevel,
    showNotification
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

const GamificationDashboard = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { userStats, achievements, xpForLevel } = useGamification();

  const currentLevelXP = xpForLevel(userStats.level);
  const nextLevelXP = xpForLevel(userStats.level + 1);
  const progressPercent = ((userStats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="gamification-dashboard" dir={language.direction}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('gamification') || 'Gamification Dashboard'}
          </h2>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
              <div className="text-2xl font-bold">{userStats.level}</div>
              <div className="text-sm opacity-90">{t('level') || 'Level'}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <div className="text-2xl font-bold">{userStats.xp}</div>
              <div className="text-sm opacity-90">XP</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
              <div className="text-2xl font-bold">{userStats.points}</div>
              <div className="text-sm opacity-90">{t('points') || 'Points'}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
              <div className="text-2xl font-bold">{userStats.streak}</div>
              <div className="text-sm opacity-90">{t('streak') || 'Streak'}</div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>{t('level') || 'Level'} {userStats.level}</span>
              <span>{userStats.xp - currentLevelXP} / {nextLevelXP - currentLevelXP} XP</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('achievements') || 'Achievements'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const isUnlocked = userStats.badges.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isUnlocked
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                          {language.code === 'ar' ? achievement.title : achievement.titleEn}
                        </h4>
                        <p className={`text-sm ${isUnlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                          {language.code === 'ar' ? achievement.description : achievement.descriptionEn}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                            +{achievement.xp} XP
                          </span>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                            +{achievement.points} {t('points') || 'points'}
                          </span>
                        </div>
                      </div>
                      {isUnlocked && (
                        <div className="text-yellow-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('badges') || 'Badges'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {userStats.badges.map((badgeId) => {
                const achievement = achievements.find(a => a.id === badgeId);
                return (
                  <div
                    key={badgeId}
                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-medium"
                    title={language.code === 'ar' ? achievement.title : achievement.titleEn}
                  >
                    <span>{achievement.icon}</span>
                    {language.code === 'ar' ? achievement.title : achievement.titleEn}
                  </div>
                );
              })}
              {userStats.badges.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('noBadgesYet') || 'No badges earned yet. Keep shopping to unlock achievements!'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const GamificationNotifications = () => {
  const { notifications } = useGamification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-in ${
            notification.type === 'level_up'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : notification.type === 'badge'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-teal-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {notification.type === 'level_up' ? '🎉' :
               notification.type === 'badge' ? '🏆' : '💰'}
            </span>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const GamificationXPBar = ({ className = '' }) => {
  const { userStats, xpForLevel } = useGamification();

  const currentLevelXP = xpForLevel(userStats.level);
  const nextLevelXP = xpForLevel(userStats.level + 1);
  const progressPercent = ((userStats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className={`gamification-xp-bar ${className}`}>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">Level {userStats.level}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {userStats.xp - currentLevelXP} / {nextLevelXP - currentLevelXP} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>
    </div>
  );
};

export { GamificationDashboard, GamificationNotifications, GamificationXPBar };