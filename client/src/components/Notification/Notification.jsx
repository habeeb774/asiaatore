import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Notification Context
const NotificationContext = createContext();

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // success, error, warning, info
      title: '',
      message: '',
      duration: 5000, // Auto-dismiss after 5 seconds
      persistent: false, // If true, won't auto-dismiss
      action: null, // { label: string, onClick: function }
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss if not persistent
    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Success notification
  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  };

  // Error notification
  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      ...options
    });
  };

  // Warning notification
  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  };

  // Info notification
  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Individual Notification Component
const NotificationItem = ({ notification, onRemove, language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 300); // Match animation duration
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: '✅',
      text: 'text-green-800 dark:text-green-200',
      title: 'text-green-900 dark:text-green-100'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: '❌',
      text: 'text-red-800 dark:text-red-200',
      title: 'text-red-900 dark:text-red-100'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: '⚠️',
      text: 'text-yellow-800 dark:text-yellow-200',
      title: 'text-yellow-900 dark:text-yellow-100'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'ℹ️',
      text: 'text-blue-800 dark:text-blue-200',
      title: 'text-blue-900 dark:text-blue-100'
    }
  };

  return (
    <div
      className={`max-w-sm w-full shadow-lg rounded-lg border pointer-events-auto transition-all duration-300 ease-in-out ${
        typeStyles[notification.type].bg
      } ${typeStyles[notification.type].border} ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
      } ${language.direction === 'rtl' ? 'rtl' : 'ltr'}`}
      dir={language.direction}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start space-x-3 rtl:space-x-reverse">
          <div className="flex-shrink-0">
            <span className="text-xl">{typeStyles[notification.type].icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            {notification.title && (
              <h4 className={`text-sm font-medium ${typeStyles[notification.type].title} mb-1`}>
                {notification.title}
              </h4>
            )}
            <p className={`text-sm ${typeStyles[notification.type].text}`}>
              {notification.message}
            </p>
            {notification.action && (
              <button
                onClick={() => {
                  notification.action.onClick();
                  handleRemove();
                }}
                className={`mt-2 text-sm font-medium ${typeStyles[notification.type].text} underline hover:no-underline transition-all`}
              >
                {notification.action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleRemove}
            className={`flex-shrink-0 p-1 rounded-lg ${typeStyles[notification.type].text} hover:bg-black/10 transition-colors`}
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();
  const { language } = useLanguage();

  if (notifications.length === 0) return null;

  return (
    <div
      className={`fixed top-4 z-50 pointer-events-none ${
        language.direction === 'rtl' ? 'left-4' : 'right-4'
      } space-y-2`}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onRemove={removeNotification}
            language={language}
          />
        </div>
      ))}
    </div>
  );
};

// Toast Notification Hook (for simpler usage)
export const useToast = () => {
  const { success, error, warning, info } = useNotifications();

  return {
    success: (message, options) => success(message, options),
    error: (message, options) => error(message, options),
    warning: (message, options) => warning(message, options),
    info: (message, options) => info(message, options),

    // Convenience methods
    show: (message, type = 'info', options = {}) => {
      const notifications = { success, error, warning, info };
      return notifications[type](message, options);
    }
  };
};

// Export the container to be rendered in the app
export { NotificationContainer };

// Default export
export default {
  NotificationProvider,
  NotificationContainer,
  useNotifications,
  useToast
};