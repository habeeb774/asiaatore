import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '../../../lib/framerLazy';
import { useLanguage } from '../../../context/LanguageContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useMarketing } from '../../../contexts/MarketingContext';
import SafeImage from '../../common/SafeImage';
import { 
  Sparkles, 
  ArrowRight, 
  ShoppingCart, 
  Star, 
  Shield, 
  Truck,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';

/**
 * HeroModern - قسم البطل الحديث والمحسّن
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - دعم كامل للـ RTL
 * - عرض الشرائح التلقائي
 * - أزرار تفاعلية
 * - عرض الفيديو
 * - أداء محسّن
 */
const HeroModern = ({ 
  autoPlay = true, 
  interval = 5000, 
  showDots = true, 
  showArrows = true,
  height = 'hero'
}) => {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const { setting } = useSettings();
  const { banners, heroContent } = useMarketing();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const isRTL = locale === 'ar';
  
  // بيانات الشرائح
  const slides = useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map(banner => ({
        id: banner.id,
        title: banner.title?.[locale] || banner.title?.en || '',
        subtitle: banner.subtitle?.[locale] || banner.subtitle?.en || '',
        description: banner.description?.[locale] || banner.description?.en || '',
        image: banner.image,
        video: banner.video,
        ctaText: banner.cta_text?.[locale] || banner.cta_text?.en || t('shop_now'),
        ctaLink: banner.cta_link || '/products',
        background: banner.background_color || 'gradient',
        features: banner.features || []
      }));
    }
    
    // بديل افتراضي
    return [
      {
        id: 'default-1',
        title: t('hero_title_1') || 'تسوق الآن',
        subtitle: t('hero_subtitle_1') || 'أفضل المنتجات',
        description: t('hero_desc_1') || 'اكتشف مجموعتنا الحصرية',
        image: setting?.heroImage || '/images/hero-1.jpg',
        ctaText: t('shop_now'),
        ctaLink: '/products',
        background: 'gradient-1',
        features: ['free_shipping', 'secure_payment', '24_support']
      },
      {
        id: 'default-2',
        title: t('hero_title_2') || 'عروض حصرية',
        subtitle: t('hero_subtitle_2') || 'خصومات تصل إلى 50%',
        description: t('hero_desc_2') || 'لا تفوت الفرصة',
        image: setting?.heroImage2 || '/images/hero-2.jpg',
        ctaText: t('view_offers'),
        ctaLink: '/offers',
        background: 'gradient-2',
        features: ['discount', 'quality', 'fast_delivery']
      }
    ];
  }, [banners, setting, locale, t]);
  
  // التنقل التلقائي
  useEffect(() => {
    if (!autoPlay || isPaused || isVideoPlaying || slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, isVideoPlaying, slides.length]);
  
  // التحكم بالشرائح
  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
    setIsVideoPlaying(false);
  }, []);
  
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsVideoPlaying(false);
  }, [slides.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsVideoPlaying(false);
  }, [slides.length]);
  
  const currentSlide = slides[currentIndex];
  
  // فئات الارتفاع
  const heightClasses = {
    hero: 'min-h-[70vh] lg:min-h-[80vh]',
    medium: 'min-h-[50vh] lg:min-h-[60vh]',
    small: 'min-h-[40vh] lg:min-h-[50vh]'
  };
  
  // فئات الخلفية
  const backgroundClasses = {
    'gradient-1': 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600',
    'gradient-2': 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600',
    'gradient-3': 'bg-gradient-to-br from-orange-600 via-red-600 to-pink-600',
    'dark': 'bg-gradient-to-br from-gray-900 to-black',
    'light': 'bg-gradient-to-br from-gray-50 to-white'
  };
  
  const bgClass = backgroundClasses[currentSlide.background] || backgroundClasses['gradient-1'];
  
  return (
    <section 
      className={`relative ${heightClasses[height] || heightClasses.hero} overflow-hidden ${bgClass}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/20" />
        {currentSlide.image && (
          <SafeImage
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover opacity-30"
            priority
          />
        )}
        
        {/* تأثيرات بصرية */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
      
      {/* المحتوى */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: isRTL ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -100 : 100 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`max-w-3xl ${isRTL ? 'mr-auto ml-0 text-right' : 'ml-auto mr-0 text-left'}`}
          >
            {/* الشارات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="text-yellow-300" size={20} />
              <span className="text-white/90 font-medium text-sm uppercase tracking-wider">
                {currentSlide.subtitle}
              </span>
            </motion.div>
            
            {/* العنوان الرئيسي */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              {currentSlide.title}
            </motion.h1>
            
            {/* الوصف */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl"
            >
              {currentSlide.description}
            </motion.p>
            
            {/* المميزات */}
            {currentSlide.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                {currentSlide.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/90">
                    {feature === 'free_shipping' && <Truck size={16} />}
                    {feature === 'secure_payment' && <Shield size={16} />}
                    {feature === '24_support' && <Star size={16} />}
                    {feature === 'discount' && <Sparkles size={16} />}
                    {feature === 'quality' && <Shield size={16} />}
                    {feature === 'fast_delivery' && <Truck size={16} />}
                    <span className="text-sm font-medium">
                      {t(feature)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* الأزرار */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => navigate(currentSlide.ctaLink)}
                className="group relative inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                {currentSlide.ctaText}
                <ArrowRight 
                  size={20} 
                  className={`transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`}
                />
              </button>
              
              {currentSlide.video && (
                <button
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-6 py-4 rounded-lg font-semibold hover:bg-white/30 transition-all"
                >
                  {isVideoPlaying ? (
                    <>
                      <ShoppingCart size={20} />
                      {t('shop_now')}
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      {t('watch_video')}
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* الأسهم */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all z-20"
            aria-label={t('previous')}
          >
            <ChevronLeft size={24} className={isRTL ? 'rotate-180' : ''} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all z-20"
            aria-label={t('next')}
          >
            <ChevronRight size={24} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </>
      )}
      
      {/* النقاط */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              } rounded-full`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* مشغل الفيديو */}
      <AnimatePresence>
        {isVideoPlaying && currentSlide.video && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/90"
            onClick={() => setIsVideoPlaying(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVideoPlaying(false);
              }}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
            >
              ×
            </button>
            <video
              src={currentSlide.video}
              controls
              autoPlay
              className="max-w-4xl max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HeroModern;
