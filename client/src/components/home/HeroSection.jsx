import React, { useState, useEffect, useCallback } from 'react';

/**
 * HeroSection Component - Advanced hero carousel with multiple slides
 */
const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const slides = [
    {
      id: 1,
      title: "اكتشف عالم التسوق الرقمي",
      subtitle: "منتجات مميزة بأسعار تنافسية",
      description: "تصفح آلاف المنتجات من أفضل العلامات التجارية العالمية والمحلية",
      ctaText: "ابدأ التسوق",
      ctaLink: "/products",
      bgGradient: "from-emerald-600 via-teal-600 to-emerald-700",
      image: "/api/placeholder/600/400",
      features: ["شحن مجاني", "ضمان الجودة", "دعم 24/7"]
    },
    {
      id: 2,
      title: "عروض خاصة هذا الأسبوع",
      subtitle: "خصومات تصل إلى 70%",
      description: "لا تفوت فرصة الحصول على أفضل العروض والتخفيضات الموسمية",
      ctaText: "شاهد العروض",
      ctaLink: "/offers",
      bgGradient: "from-purple-600 via-pink-600 to-purple-700",
      image: "/api/placeholder/600/400",
      features: ["خصومات هائلة", "منتجات أصلية", "إرجاع مجاني"]
    },
    {
      id: 3,
      title: "خدمة التوصيل السريع",
      subtitle: "وصول الطلب خلال 24 ساعة",
      description: "نضمن توصيل طلباتك في أسرع وقت ممكن مع تغليف آمن ومريح",
      ctaText: "اطلب الآن",
      ctaLink: "/delivery",
      bgGradient: "from-blue-600 via-indigo-600 to-blue-700",
      image: "/api/placeholder/600/400",
      features: ["توصيل سريع", "تتبع الطلب", "دفع آمن"]
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Progress bar animation
  useEffect(() => {
    if (!isAutoPlaying) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [currentSlide, isAutoPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        nextSlide();
      } else if (e.key === 'ArrowRight') {
        prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide, toggleAutoPlay]);

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-gray-900"
      role="region"
      aria-label="قسم البطل الرئيسي"
    >
      {/* Fixed Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-95" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-white space-y-8">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: index === currentSlide ? '0.3s' : '0s' }}
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                      {slide.subtitle}
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                      <span className="bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
                        {slide.title}
                      </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
                      {slide.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-4">
                      {slide.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20"
                          style={{ animationDelay: `${featureIndex * 0.1}s` }}
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <a
                        href={slide.ctaLink}
                        className="group bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl inline-flex items-center justify-center"
                      >
                        {slide.ctaText}
                        <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>

                      <button className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm">
                        تعرف علينا
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Visual Element */}
            <div className="relative">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100'
                      : 'opacity-0 translate-x-8 scale-95'
                  }`}
                  style={{ transitionDelay: index === currentSlide ? '0.5s' : '0s' }}
                >
                  <div className="space-y-8">
                    {/* Main Visual Card with Slide Background */}
                    <div className={`bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden`}>
                      {/* Slide Background Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} opacity-20 rounded-3xl`} />
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 rounded-3xl"
                        style={{
                          backgroundImage: `url(${slide.image})`,
                          filter: 'blur(1px)'
                        }}
                      />

                      <div className="relative z-10 aspect-square bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-white">متجرنا</h3>
                          <p className="text-gray-300">تسوق ذكي وآمن</p>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                        <div className="text-3xl font-bold text-white mb-2">10K+</div>
                        <div className="text-sm text-gray-300">منتج</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                        <div className="text-3xl font-bold text-white mb-2">50K+</div>
                        <div className="text-sm text-gray-300">عميل</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                        <div className="text-3xl font-bold text-white mb-2">24/7</div>
                        <div className="text-sm text-gray-300">دعم</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
                        <div className="text-3xl font-bold text-white mb-2">99%</div>
                        <div className="text-sm text-gray-300">رضا</div>
                      </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                      <h4 className="text-lg font-semibold text-white mb-4 text-center">لماذا تختارنا؟</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-200 text-sm">شحن مجاني للطلبات فوق 200 ريال</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-200 text-sm">إرجاع مجاني خلال 30 يوم</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-200 text-sm">دفع آمن ومشفر</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-200 text-sm">دعم فني متخصص</span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Stats */}
                    <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg animate-bounce">
                      جديد
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                      موثوق
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 rtl:space-x-reverse">
        {/* Previous Button */}
        <button
          onClick={prevSlide}
          className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/20"
          aria-label="الشريحة السابقة"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dots Navigation */}
        <div className="flex space-x-2 rtl:space-x-reverse">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`الانتقال إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/20"
          aria-label="الشريحة التالية"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Auto-play Toggle */}
      <button
        onClick={toggleAutoPlay}
        className="absolute top-8 right-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/20"
        aria-label={isAutoPlaying ? "إيقاف التشغيل التلقائي" : "تشغيل التلقائي"}
      >
        {isAutoPlaying ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H14m-4-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Slide Counter */}
      <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold border border-white/20">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  );
};

export default HeroSection;