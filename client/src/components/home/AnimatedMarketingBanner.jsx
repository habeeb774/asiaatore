import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy.js';
import { useLanguage } from '../../stores/LanguageContext';
import { ButtonLink } from '../ui';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

// Enhanced animated marketing banner
const AnimatedMarketingBanner = ({
  banner,
  onClose,
  className = '',
  autoHide = false,
  duration = 10000
}) => {
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onClose]);

  if (!banner) return null;

  const isExternal = banner.linkUrl && typeof banner.linkUrl === 'string' &&
    /^(https?:)?\/\//i.test(banner.linkUrl) && !banner.linkUrl.startsWith('/');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.95 }}
          animate={{ opacity: 1, height: 'auto', scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 }
          }}
          className={`relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl ${className}`}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 2
              }}
            />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: '100%',
                  opacity: 0
                }}
                animate={{
                  y: '-20%',
                  opacity: [0, 1, 0],
                  x: Math.random() * 100 + '%'
                }}
                transition={{
                  duration: Math.random() * 4 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-3"
                >
                  {banner.image && (
                    <motion.img
                      src={banner.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    />
                  )}
                  <div>
                    <motion.h3
                      className="text-lg md:text-xl font-bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {banner.title || (locale === 'ar' ? 'إعلان مميز' : 'Featured Ad')}
                    </motion.h3>
                    {banner.description && (
                      <motion.p
                        className="text-sm text-white/90"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {banner.description}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 mt-4"
                >
                  {banner.linkUrl && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ButtonLink
                        to={banner.linkUrl}
                        external={isExternal}
                        className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:border-white/50 px-6 py-2 rounded-full font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span className="flex items-center gap-2">
                          {locale === 'ar' ? 'اكتشف المزيد' : 'Learn More'}
                          {isExternal && <ExternalLink className="w-4 h-4" />}
                        </span>
                      </ButtonLink>
                    </motion.div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => {
                        setIsVisible(false);
                        onClose?.();
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Progress bar for auto-hide */}
          {autoHide && duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Banner carousel for multiple banners
const AnimatedBannerCarousel = ({
  banners = [],
  className = '',
  autoPlay = true,
  interval = 6000,
  showNavigation = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isPlaying || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, banners.length, interval]);

  if (!banners.length) return null;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedMarketingBanner
            banner={banners[currentIndex]}
            autoHide={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation controls */}
      {showNavigation && banners.length > 1 && (
        <>
          <motion.button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Play/Pause button */}
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute bottom-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <div className="w-3 h-3 flex items-center justify-center">
                <div className="w-1 h-3 bg-white rounded-sm" />
                <div className="w-1 h-3 bg-white rounded-sm ml-0.5" />
              </div>
            ) : (
              <div className="w-0 h-0 border-l-3 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-0.5" />
            )}
          </motion.button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white shadow-lg scale-125'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Banner stack for showing multiple banners
const AnimatedBannerStack = ({
  banners = [],
  maxVisible = 3,
  className = ''
}) => {
  const [visibleBanners, setVisibleBanners] = useState(banners.slice(0, maxVisible));

  const removeBanner = (bannerId) => {
    setVisibleBanners(prev => prev.filter(b => b.id !== bannerId));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence>
        {visibleBanners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
          >
            <AnimatedMarketingBanner
              banner={banner}
              onClose={() => removeBanner(banner.id)}
              autoHide={true}
              duration={8000 + index * 2000}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export { AnimatedMarketingBanner, AnimatedBannerCarousel, AnimatedBannerStack };
export default AnimatedMarketingBanner;