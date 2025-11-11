import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy.jsx';
import { useLanguage } from '../../stores/LanguageContext';
import { ButtonLink } from '../ui';
import { Sparkles, Gift, Star, Zap, Flame } from 'lucide-react';

// Animated background patterns
const BackgroundPattern = ({ variant = 'gradient' }) => {
  const patterns = {
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    fire: 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500',
    electric: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500',
    premium: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500'
  };

  return (
    <div className={`absolute inset-0 ${patterns[variant]} opacity-90`}>
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: '100%',
              scale: 0
            }}
            animate={{
              y: '-100%',
              scale: [0, 1, 0],
              x: Math.random() * 100 + '%'
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Animated icon component
const AnimatedIcon = ({ icon: Icon, className = '' }) => (
  <motion.div
    animate={{
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    <Icon className="w-8 h-8" />
  </motion.div>
);

// Main animated banner component
const AnimatedOfferBanner = ({
  title,
  subtitle,
  description,
  ctaText,
  ctaLink = '/offers',
  variant = 'default',
  icon = 'sparkles',
  duration = 5000,
  className = ''
}) => {
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const icons = {
    sparkles: Sparkles,
    gift: Gift,
    star: Star,
    zap: Zap,
    flame: Flame
  };

  const IconComponent = icons[icon] || Sparkles;

  const variants = {
    default: {
      background: 'gradient',
      textColor: 'text-white',
      glow: 'shadow-2xl shadow-emerald-500/50'
    },
    fire: {
      background: 'fire',
      textColor: 'text-white',
      glow: 'shadow-2xl shadow-red-500/50'
    },
    electric: {
      background: 'electric',
      textColor: 'text-white',
      glow: 'shadow-2xl shadow-purple-500/50'
    },
    premium: {
      background: 'premium',
      textColor: 'text-white',
      glow: 'shadow-2xl shadow-yellow-500/50'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className={`relative overflow-hidden rounded-2xl ${currentVariant.glow} ${className}`}
        >
          <BackgroundPattern variant={currentVariant.background} />

          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex items-center justify-between gap-8">
              <div className="flex-1 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <AnimatedIcon
                    icon={IconComponent}
                    className={`${currentVariant.textColor} drop-shadow-lg`}
                  />
                  <h3 className={`text-2xl md:text-3xl font-bold ${currentVariant.textColor} drop-shadow-lg`}>
                    {title}
                  </h3>
                </motion.div>

                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`text-lg md:text-xl font-semibold ${currentVariant.textColor} drop-shadow-lg`}
                  >
                    {subtitle}
                  </motion.p>
                )}

                {description && (
                  <motion.p
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`${currentVariant.textColor}/90 drop-shadow-md max-w-2xl`}
                  >
                    {description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4"
                >
                  <ButtonLink
                    to={ctaLink}
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:border-white/50 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {ctaText || (locale === 'ar' ? 'اكتشف الآن' : 'Discover Now')}
                    </motion.span>
                  </ButtonLink>
                </motion.div>
              </div>

              {/* Decorative elements */}
              <div className="hidden md:flex flex-col gap-4">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <IconComponent className={`w-10 h-10 ${currentVariant.textColor}`} />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Star className={`w-8 h-8 ${currentVariant.textColor}`} />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Banner carousel component
const AnimatedBannerCarousel = ({
  banners = [],
  className = '',
  autoPlayInterval = 8000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval]);

  if (!banners.length) return null;

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedOfferBanner {...banners[currentIndex]} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white shadow-lg scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { AnimatedOfferBanner, AnimatedBannerCarousel };
export default AnimatedOfferBanner;