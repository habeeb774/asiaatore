import React, { useState, useEffect, useRef } from 'react';
import { useLanguage, LocalizedText } from '../../contexts/LanguageContext';
import { createPortal } from 'react-dom';

const AdvancedNotifications = ({
  notifications = [],
  position = 'top-right',
  maxNotifications = 5,
  autoClose = true,
  autoCloseDelay = 5000,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const timeoutsRef = useRef(new Map());

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Add notification
  useEffect(() => {
    const newNotifications = notifications.filter(
      n => !visibleNotifications.find(vn => vn.id === n.id)
    );

    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => {
        const updated = [...prev, ...newNotifications];

        // Limit to maxNotifications
        if (updated.length > maxNotifications) {
          const toRemove = updated.slice(0, updated.length - maxNotifications);
          toRemove.forEach(notification => {
            const timeout = timeoutsRef.current.get(notification.id);
            if (timeout) {
              clearTimeout(timeout);
              timeoutsRef.current.delete(notification.id);
            }
          });
          return updated.slice(-maxNotifications);
        }

        return updated;
      });
    }
  }, [notifications, maxNotifications]);

  // Auto-close notifications
  useEffect(() => {
    if (!autoClose) return;

    visibleNotifications.forEach(notification => {
      if (!timeoutsRef.current.has(notification.id)) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, autoCloseDelay);

        timeoutsRef.current.set(notification.id, timeout);
      }
    });

    return () => {
      const currentTimeouts = timeoutsRef.current;
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeouts.clear();
    };
  }, [visibleNotifications, autoClose, autoCloseDelay]);

  const removeNotification = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  };

  const pauseAutoClose = (id) => {
    if (!autoClose) return;

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  };

  const resumeAutoClose = (id) => {
    if (!autoClose) return;

    const timeout = setTimeout(() => {
      removeNotification(id);
    }, autoCloseDelay);

    timeoutsRef.current.set(id, timeout);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getNotificationClasses = (type) => {
    const baseClasses = 'flex items-start p-4 mb-4 text-sm rounded-lg shadow-lg transition-all duration-300 transform translate-x-0';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800`;
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  const container = (
    <div
      className={`fixed z-50 ${positionClasses[position]} ${language.direction === 'rtl' ? 'rtl' : 'ltr'} ${className}`}
      dir={language.direction}
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`${getNotificationClasses(notification.type)} animate-slide-in`}
          onMouseEnter={() => pauseAutoClose(notification.id)}
          onMouseLeave={() => resumeAutoClose(notification.id)}
          style={{
            animationDelay: `${index * 100}ms`,
            transform: language.direction === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)'
          }}
        >
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="ml-3 mr-4 rtl:ml-4 rtl:mr-3 flex-1">
            {notification.title && (
              <div className="font-medium mb-1">
                {notification.title}
              </div>
            )}

            <div className="text-sm">
              {notification.message}
            </div>

            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2 rtl:space-x-reverse mt-3">
                {notification.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => {
                      action.onClick();
                      removeNotification(notification.id);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      action.primary
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 ml-2 rtl:mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label={t('close')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Progress bar for auto-close */}
          {autoClose && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-75 ease-linear"
                style={{
                  width: '100%',
                  animation: `shrink ${autoCloseDelay}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return createPortal(container, document.body);
};

// Notification Hook
export const useAdvancedNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const success = (message, options = {}) => addNotification({ type: 'success', message, ...options });
  const error = (message, options = {}) => addNotification({ type: 'error', message, ...options });
  const warning = (message, options = {}) => addNotification({ type: 'warning', message, ...options });
  const info = (message, options = {}) => addNotification({ type: 'info', message, ...options });

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

export default AdvancedNotifications;