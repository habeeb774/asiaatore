import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Modal from '../ui/Modal';
import LazyImage from '../common/LazyImage';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    gamification: true,
    rewards: true,
    challenges: true,
    promotions: true,
    orders: true,
    system: true
  });

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 10 seconds for non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, 10000);
    }

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mark as read
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Update settings
  const updateSettings = (settings) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  // Trigger smart notifications based on user actions
  const triggerNotification = (type, data = {}) => {
    if (!notificationSettings[type]) return;

    switch (type) {
      case 'gamification':
        if (data.levelUp) {
          addNotification({
            type: 'success',
            title: '🎉 Level Up!',
            titleAr: '🎉 ترقية!',
            message: `Congratulations! You've reached level ${data.level}!`,
            messageAr: `مبروك! وصلت للمستوى ${data.level}!`,
            icon: '🎊',
            action: { label: 'View Dashboard', labelAr: 'عرض لوحة التحكم' }
          });
        } else if (data.badge) {
          addNotification({
            type: 'achievement',
            title: '🏆 New Badge!',
            titleAr: '🏆 شارة جديدة!',
            message: `You've earned the "${data.badge}" badge!`,
            messageAr: `حصلت على شارة "${data.badge}"!`,
            icon: '🏅',
            action: { label: 'View Badges', labelAr: 'عرض الشارات' }
          });
        }
        break;

      case 'rewards':
        if (data.redeemed) {
          addNotification({
            type: 'success',
            title: '🎁 Reward Redeemed!',
            titleAr: '🎁 تم استبدال المكافأة!',
            message: `You've successfully redeemed ${data.reward}!`,
            messageAr: `تم استبدال ${data.reward} بنجاح!`,
            icon: '💰',
            action: { label: 'View Rewards', labelAr: 'عرض المكافآت' }
          });
        } else if (data.available) {
          addNotification({
            type: 'info',
            title: '💎 New Rewards Available!',
            titleAr: '💎 مكافآت جديدة متاحة!',
            message: `${data.count} new rewards you can afford!`,
            messageAr: `${data.count} مكافآت جديدة يمكنك تحمل تكلفتها!`,
            icon: '🎯',
            action: { label: 'View Store', labelAr: 'عرض المتجر' }
          });
        }
        break;

      case 'challenges':
        if (data.completed) {
          addNotification({
            type: 'achievement',
            title: '🎯 Challenge Completed!',
            titleAr: '🎯 تم إكمال التحدي!',
            message: `You've completed "${data.challenge}"! Claim your reward.`,
            messageAr: `أكملت "${data.challenge}"! استلم مكافأتك.`,
            icon: '🏁',
            action: { label: 'Claim Reward', labelAr: 'استلام المكافأة' },
            persistent: true
          });
        } else if (data.progress) {
          addNotification({
            type: 'progress',
            title: '📈 Challenge Progress!',
            titleAr: '📈 تقدم في التحدي!',
            message: `${data.progress}% complete on "${data.challenge}"`,
            messageAr: `${data.progress}% مكتمل في "${data.challenge}"`,
            icon: '📊'
          });
        }
        break;

      case 'promotions':
        if (data.flashSale) {
          addNotification({
            type: 'promotion',
            title: '⚡ Flash Sale!',
            titleAr: '⚡ تخفيضات سريعة!',
            message: `${data.discount}% off on ${data.category}! Limited time.`,
            messageAr: `${data.discount}% خصم على ${data.category}! وقت محدود.`,
            icon: '🔥',
            action: { label: 'Shop Now', labelAr: 'تسوق الآن' },
            persistent: true
          });
        } else if (data.newArrival) {
          addNotification({
            type: 'info',
            title: '🆕 New Arrivals!',
            titleAr: '🆕 وصولات جديدة!',
            message: `Check out our latest ${data.category} collection!`,
            messageAr: `تحقق من مجموعتنا الجديدة من ${data.category}!`,
            icon: '📦',
            action: { label: 'Explore', labelAr: 'استكشف' }
          });
        }
        break;

      case 'orders':
        if (data.shipped) {
          addNotification({
            type: 'success',
            title: '🚚 Order Shipped!',
            titleAr: '🚚 تم شحن الطلب!',
            message: `Your order #${data.orderId} has been shipped.`,
            messageAr: `تم شحن طلبك رقم ${data.orderId}.`,
            icon: '📦',
            action: { label: 'Track Order', labelAr: 'تتبع الطلب' }
          });
        } else if (data.delivered) {
          addNotification({
            type: 'success',
            title: '✅ Order Delivered!',
            titleAr: '✅ تم تسليم الطلب!',
            message: `Your order #${data.orderId} has been delivered.`,
            messageAr: `تم تسليم طلبك رقم ${data.orderId}.`,
            icon: '🏠',
            action: { label: 'Leave Review', labelAr: 'اترك مراجعة' }
          });
        }
        break;

      case 'system':
        if (data.maintenance) {
          addNotification({
            type: 'warning',
            title: '🔧 Scheduled Maintenance',
            titleAr: '🔧 صيانة مجدولة',
            message: `We'll be down for maintenance ${data.time}.`,
            messageAr: `سنكون متوقفين للصيانة ${data.time}.`,
            icon: '⚙️',
            persistent: true
          });
        } else if (data.update) {
          addNotification({
            type: 'info',
            title: '🎉 New Features!',
            titleAr: '🎉 مميزات جديدة!',
            message: `We've added ${data.features}. Check them out!`,
            messageAr: `أضفنا ${data.features}. تحقق منها!`,
            icon: '✨',
            action: { label: 'Learn More', labelAr: 'اعرف المزيد' }
          });
        }
        break;
    }
  };

  const value = {
    notifications,
    notificationSettings,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount,
    updateSettings,
    triggerNotification
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

const SmartNotifications = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  const visibleNotifications = notifications.slice(0, 5); // Show max 5

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
      {visibleNotifications.map((notification, index) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        />
      ))}
    </div>
  );
};

const NotificationToast = ({ notification, onClose, onRead, style }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-400';
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-400';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-yellow-500';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-400';
      case 'promotion':
        return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-400';
      case 'progress':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400';
    }
  };

  return (
    <div
      className={`max-w-md w-full pointer-events-auto transition-all duration-300 transform ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={style}
    >
      <div className={`p-4 rounded-lg shadow-lg border-l-4 ${getTypeStyles(notification.type)}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">
            {notification.icon || '🔔'}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">
              {language.code === 'ar' ? notification.titleAr || notification.title : notification.title}
            </h4>
            <p className="text-sm opacity-90 mt-1 leading-tight">
              {language.code === 'ar' ? notification.messageAr || notification.message : notification.message}
            </p>

            {notification.action && (
              <button
                onClick={() => {
                  onRead();
                  handleClose();
                  // Here you would navigate to the action
                  console.log('Action:', notification.action);
                }}
                className="mt-2 text-xs underline opacity-80 hover:opacity-100 transition-opacity"
              >
                {language.code === 'ar' ? notification.action.labelAr || notification.action.label : notification.action.label}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {!notification.persistent && (
          <div className="mt-3 w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all duration-100 ease-linear"
              style={{
                animation: 'shrink 10s linear forwards'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const {
    notifications,
    notificationSettings,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount,
    updateSettings
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('all') || 'All', count: notifications.length },
    { id: 'unread', label: t('unread') || 'Unread', count: getUnreadCount() }
  ];

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleSettingChange = (setting, value) => {
    updateSettings({ [setting]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="notifications-panel" dir={language.direction}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('notifications') || 'Notifications'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {t('markAllRead') || 'Mark all read'}
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {t('clearAll') || 'Clear all'}
              </button>
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
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'unread'
                    ? (t('noUnreadNotifications') || 'No unread notifications')
                    : (t('noNotifications') || 'No notifications yet')
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                      {notification.icon || '🔔'}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-semibold ${
                            notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {language.code === 'ar' ? notification.titleAr || notification.title : notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {language.code === 'ar' ? notification.messageAr || notification.message : notification.message}
                          </p>
                        </div>

                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            {t('markRead') || 'Mark read'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>

                        {notification.action && (
                          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                            {language.code === 'ar' ? notification.action.labelAr || notification.action.label : notification.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Settings */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('notificationSettings') || 'Notification Settings'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(notificationSettings).map(([key, enabled]) => (
                <label key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleSettingChange(key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {t(key) || key.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const NotificationsWidget = ({ className = '' }) => {
  const { getUnreadCount } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const unreadCount = getUnreadCount();

  return (
    <>
      <button
        className={`notifications-widget relative ${className}`}
        onClick={() => setShowPanel(true)}
      >
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.06 9.06 0 001.832 5.683L4 21l4.868-8.317z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      <NotificationsPanel isOpen={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
};

export { SmartNotifications, NotificationsPanel, NotificationsWidget };
