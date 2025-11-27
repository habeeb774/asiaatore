import React from 'react';
import { motion } from '../../../lib/framerLazy';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinnerModern - مؤشر التحميل الحديث
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - أحجام متعددة
 * - ألوان قابلة للتخصيص
 * - دعم الوضع المظلم
 * - رسوم متحركة سلسة
 */
const LoadingSpinnerModern = ({
  size = 'md', // xs, sm, md, lg, xl
  color = 'primary', // primary, secondary, success, warning, error, info
  variant = 'default', // default, dots, pulse, wave
  text,
  overlay = false,
  className = ''
}) => {
  // فئات الأحجام
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // فئات الألوان
  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-cyan-600 dark:text-cyan-400'
  };
  
  // نسخة المؤشر الافتراضي (دائري)
  if (variant === 'default') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2 
          size={size === 'xs' ? 16 : size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 64}
          className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        />
        {text && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    );
  }
  
  // نسخة النقاط
  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          ))}
        </div>
        {text && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    );
  }
  
  // نسخة النبضة
  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <motion.span
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.span>
        )}
      </div>
    );
  }
  
  // نسخة الموجة
  if (variant === 'wave') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
              key={index}
              className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.1
              }}
            />
          ))}
        </div>
        {text && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    );
  }
  
  // نسخة Overlay (شاشة تحميل كاملة)
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          <LoadingSpinnerModern
            size={size}
            color={color}
            variant={variant === 'overlay' ? 'default' : variant}
            text={text}
          />
        </div>
      </div>
    );
  }
  
  // افتراضي
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full border-2 border-current border-t-transparent animate-spin`} />
    </div>
  );
};

export default LoadingSpinnerModern;
