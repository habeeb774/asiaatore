import React, { useState, useEffect } from 'react';
import { motion } from '../../../lib/framerLazy';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

/**
 * ThemeToggleModern - مبدل الثيمات الحديث
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - دعم الوضع الداكن/الفاتح/النظام
 * - دعم كامل للـ RTL
 * - حفظ التفضيلات
 * - رسوم متحركة سلسة
 */
const ThemeToggleModern = ({ 
  variant = 'dropdown', // dropdown, toggle, switch
  showLabel = true,
  size = 'md' // sm, md, lg
}) => {
  const { theme, setTheme } = useTheme();
  const { locale, t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const isRTL = locale === 'ar';
  
  // منع مشاكل الـ SSR
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  // خيارات الثيمات
  const themes = [
    {
      value: 'light',
      label: t('light_theme'),
      icon: Sun,
      description: t('light_theme_desc')
    },
    {
      value: 'dark',
      label: t('dark_theme'),
      icon: Moon,
      description: t('dark_theme_desc')
    },
    {
      value: 'system',
      label: t('system_theme'),
      icon: Monitor,
      description: t('system_theme_desc')
    }
  ];
  
  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;
  
  // فئات الحجم
  const sizeClasses = {
    sm: {
      button: 'p-2 text-sm',
      dropdown: 'w-40',
      icon: 'w-4 h-4'
    },
    md: {
      button: 'p-2.5 text-base',
      dropdown: 'w-48',
      icon: 'w-5 h-5'
    },
    lg: {
      button: 'p-3 text-lg',
      dropdown: 'w-56',
      icon: 'w-6 h-6'
    }
  };
  
  const classes = sizeClasses[size];
  
  // معالجة تغيير الثيم
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };
  
  // نسخة القائمة المنسدلة
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${classes.button} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
          aria-label={t('change_theme')}
        >
          <CurrentIcon className={classes.icon} />
          {showLabel && (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {currentTheme.label}
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className={`ml-auto ${isRTL ? 'rotate-180' : ''}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10z" />
            </svg>
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-2 ${classes.dropdown} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden ${
                  isRTL ? 'right-0' : 'left-0'
                }`}
              >
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isActive = theme === themeOption.value;
                  
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => handleThemeChange(themeOption.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <Icon className={classes.icon} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {themeOption.description}
                        </div>
                      </div>
                      {isActive && (
                        <Check className={classes.icon} />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // نسخة التبديل البسيط
  if (variant === 'toggle') {
    return (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={themeOption.description}
            >
              <Icon className={classes.icon} />
              {showLabel && (
                <span className="text-sm font-medium">
                  {themeOption.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  
  // نسخة المفتاح (Switch)
  if (variant === 'switch') {
    const isDark = theme === 'dark';
    
    return (
      <button
        onClick={() => handleThemeChange(isDark ? 'light' : 'dark')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isDark ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        aria-label={t('toggle_theme')}
      >
        <span className="sr-only">{t('toggle_theme')}</span>
        
        {/* Icons */}
        <Sun className="absolute left-1 w-4 h-4 text-gray-400 transition-opacity" />
        <Moon className="absolute right-1 w-4 h-4 text-gray-400 transition-opacity" />
        
        {/* Toggle */}
        <motion.span
          animate={{ x: isDark ? 24 : 2 }}
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform"
        />
        
        {/* Active icon highlight */}
        <motion.div
          animate={{ opacity: isDark ? 1 : 0 }}
          className="absolute right-1 w-4 h-4 text-blue-600 pointer-events-none"
        >
          <Moon size={16} />
        </motion.div>
        
        <motion.div
          animate={{ opacity: isDark ? 0 : 1 }}
          className="absolute left-1 w-4 h-4 text-yellow-500 pointer-events-none"
        >
          <Sun size={16} />
        </motion.div>
      </button>
    );
  }
  
  // افتراضي - زر بسيط
  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        handleThemeChange(nextTheme);
      }}
      className={`flex items-center gap-2 ${classes.button} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
      aria-label={t('toggle_theme')}
    >
      <CurrentIcon className={classes.icon} />
      {showLabel && (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {currentTheme.label}
        </span>
      )}
    </button>
  );
};

export default ThemeToggleModern;
