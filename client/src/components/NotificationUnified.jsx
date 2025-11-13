import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '../lib/framerLazy';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  BellOff
} from 'lucide-react';
import { useLanguage } from '../stores/LanguageContext';

/**
 * مكون Notification الموحد - يجمع أفضل الميزات من مكونات الإشعارات المختلفة
 *
 * الميزات المدعومة:
 * - أنواع متعددة من الإشعارات (نجاح، خطأ، تحذير، معلومات)
 * - إشعارات مؤقتة ودائمة
 * - إشعارات قابلة للإغلاق
 * - دعم اللغات المتعددة
 * - تأثيرات بصرية متقدمة
 * - إدارة متعددة الإشعارات
 * - دعم الوضع المظلم
 * - إشعارات قابلة للتنقل
 */
const Notification = ({
  id,
  type = 'info', // success, error, warning, info
  title,
  message,
  duration = 5000, // مدة العرض بالميلي ثانية (0 = دائم)
  isClosable = true,
  isPersistent = false,
  position = 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
  onClose,
  onClick,
  actionButton,
  className = '',
  icon: customIcon
}) => {
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // إعدادات الأيقونات حسب النوع
  const getIconConfig = () => {
    const configs = {
      success: {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      error: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      },
      warning: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      },
      info: {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      }
    };

    return configs[type] || configs.info;
  };

  const iconConfig = getIconConfig();
  const IconComponent = customIcon || iconConfig.icon;

  // إغلاق الإشعار
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose(id);
    }, 300); // انتظار انتهاء التأثير البصري
  }, [id, onClose]);

  // النقر على الإشعار
  const handleClick = useCallback(() => {
    if (onClick) onClick(id);
  }, [id, onClick]);

  // إغلاق تلقائي
  useEffect(() => {
    if (duration > 0 && !isPersistent) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, isPersistent, handleClose]);

  // إذا لم يكن الإشعار مرئياً، لا نعرض شيئاً
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`max-w-sm w-full shadow-lg rounded-lg border ${iconConfig.borderColor} ${className} ${
          isExiting ? 'pointer-events-none' : 'cursor-pointer'
        }`}
        initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.3, ease: 'easeOut' }
        }}
        exit={{
          opacity: 0,
          y: position.includes('top') ? -20 : 20,
          scale: 0.95,
          transition: { duration: 0.2 }
        }}
        onClick={handleClick}
        role="alert"
        aria-live="assertive"
      >
        <div className={`p-4 ${iconConfig.bgColor} rounded-lg`}>
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            {/* الأيقونة */}
            <div className={`flex-shrink-0 ${iconConfig.color}`}>
              <IconComponent className="w-6 h-6" />
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {title}
                </h4>
              )}
              {message && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              )}

              {/* زر الإجراء */}
              {actionButton && (
                <div className="mt-3">
                  {actionButton}
                </div>
              )}
            </div>

            {/* زر الإغلاق */}
            {isClosable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={locale === 'ar' ? 'إغلاق الإشعار' : 'Close notification'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * مكون NotificationContainer - حاوي الإشعارات
 * يدير عرض متعدد الإشعارات في مواقع مختلفة
 */
export const NotificationContainer = ({
  notifications = [],
  position = 'top-right',
  maxNotifications = 5,
  className = ''
}) => {
  // ترتيب الإشعارات حسب الموقع
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };

    return positions[position] || positions['top-right'];
  };

  // الحصول على الإشعارات المحدودة
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 space-y-3 ${className}`}
      style={{ direction: 'ltr' }} // الإشعارات دائماً من اليسار إلى اليمين
    >
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: 'easeOut'
            }}
          >
            <Notification
              {...notification}
              position={position}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * خطاف useNotifications - لإدارة الإشعارات
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { locale } = useLanguage();

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      duration: 5000,
      isClosable: true,
      isPersistent: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    return id;
  }, []);

  // إزالة إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // مسح جميع الإشعارات
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // إشعارات مسبقة الإعداد
  const showSuccess = useCallback((message, title) => {
    return addNotification({
      type: 'success',
      title: title || (locale === 'ar' ? 'نجح' : 'Success'),
      message
    });
  }, [addNotification, locale]);

  const showError = useCallback((message, title) => {
    return addNotification({
      type: 'error',
      title: title || (locale === 'ar' ? 'خطأ' : 'Error'),
      message,
      duration: 0 // الإشعارات الخطأ دائمة حتى يتم إغلاقها يدوياً
    });
  }, [addNotification, locale]);

  const showWarning = useCallback((message, title) => {
    return addNotification({
      type: 'warning',
      title: title || (locale === 'ar' ? 'تحذير' : 'Warning'),
      message
    });
  }, [addNotification, locale]);

  const showInfo = useCallback((message, title) => {
    return addNotification({
      type: 'info',
      title: title || (locale === 'ar' ? 'معلومات' : 'Info'),
      message
    });
  }, [addNotification, locale]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

/**
 * مكون NotificationProvider - مزود الإشعارات
 * يوفر سياق الإشعارات للتطبيق بأكمله
 */
export const NotificationProvider = ({ children }) => {
  const notificationManager = useNotifications();

  return (
    <NotificationContext.Provider value={notificationManager}>
      {children}

      {/* حاويات الإشعارات في جميع المواقع */}
      <NotificationContainer
        notifications={notificationManager.notifications}
        position="top-right"
        maxNotifications={3}
      />
      <NotificationContainer
        notifications={notificationManager.notifications}
        position="bottom-right"
        maxNotifications={2}
      />
      <NotificationContainer
        notifications={notificationManager.notifications}
        position="top-center"
        maxNotifications={1}
      />
    </NotificationContext.Provider>
  );
};

// سياق الإشعارات
export const NotificationContext = React.createContext();

// خطاف لاستخدام سياق الإشعارات
export const useNotificationContext = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default Notification;