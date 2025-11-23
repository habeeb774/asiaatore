import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import '../../styles/HeroUnified.css'
import '../../styles/swiper.css'
import '../../styles/all.css'
import { useHeroSwiper } from './swiper'
import SafeImage from '../common/SafeImage'
import { useSettings } from '../../contexts/SettingsContext'
import { useMarketing } from '../../contexts/MarketingContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAds } from '../../hooks/useAds'
import HomeHighlightBar from '../home/HomeHighlightBar'

export default function HeroUnified(){
  // جلب إعدادات المتجر
  const { setting } = useSettings();
  const marketing = useMarketing?.() || {};
  const { locale = 'ar' } = useLanguage() || {};

  const homepageBanners = useMemo(() => {
    const source = marketing?.byLocation?.homepage?.length
      ? marketing.byLocation.homepage
      : Array.isArray(marketing?.banners)
        ? marketing.banners.filter((banner) => !banner.location || banner.location === 'homepage')
        : [];
    return Array.isArray(source) ? source : [];
  }, [marketing?.byLocation, marketing?.banners]);

  const { data: legacyAds = [] } = useAds({ enabled: homepageBanners.length === 0 });

  const pickLocaleValue = useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (locale === 'ar') return value.ar || value.en || value.default || '';
    if (locale === 'en') return value.en || value.ar || value.default || '';
    return value.default || value.en || value.ar || '';
  }, [locale]);

  const defaultSlides = useMemo(() => ([
    {
      id: 'default-1',
      title: locale === 'ar' ? 'تسوق أحدث المنتجات' : 'Shop the Latest Collections',
      subtitle: locale === 'ar' ? 'عروض حصرية مع شحن سريع لجميع المناطق' : 'Exclusive offers with fast nationwide delivery',
      image: '/images/hero-background.svg',
      link: '/products'
    },
    {
      id: 'default-2',
      title: locale === 'ar' ? 'خصومات نهاية الأسبوع' : 'Weekend Deals',
      subtitle: locale === 'ar' ? 'وفر حتى 40٪ على مختاراتنا المميزة' : 'Save up to 40% on curated picks',
      image: '/images/hero-background.svg',
      link: '/offers'
    }
  ]), [locale]);

  const heroSlides = useMemo(() => {
    if (homepageBanners.length) {
      return homepageBanners.map((banner, index) => {
        const variants = banner?.imageVariants || {};
        const preferred = variants?.large || variants?.medium || banner?.image;
        const ctaText = banner?.linkUrl
          ? (locale === 'ar' ? 'اكتشف الآن' : 'Discover Now')
          : null;
        return {
          id: banner.id || `banner-${index}`,
          title: pickLocaleValue(banner.title) || pickLocaleValue(banner.body) || (locale === 'ar' ? 'عرض مميز' : 'Featured Offer'),
          subtitle: pickLocaleValue(banner.body),
          image: preferred || '/images/hero-background.svg',
          link: banner.linkUrl || '#',
          cta: ctaText ? { text: ctaText, link: banner.linkUrl } : null
        };
      });
    }

    if (legacyAds.length) {
      return legacyAds.map((ad, index) => ({
        id: ad.id || `ad-${index}`,
        title: ad.title || (locale === 'ar' ? 'عرض حصري' : 'Exclusive Deal'),
        subtitle: ad.description || '',
        image: ad.image || '/images/hero-background.svg',
        link: ad.link || '#',
        cta: ad.link ? { text: locale === 'ar' ? 'تعرف على المزيد' : 'Learn More', link: ad.link } : null
      }));
    }

    return defaultSlides;
  }, [homepageBanners, legacyAds, defaultSlides, locale, pickLocaleValue]);

  const defaultHighlights = useMemo(() => ([
    {
      id: 'highlight-delivery',
      title: locale === 'ar' ? 'توصيل سريع' : 'Fast Delivery',
      description: locale === 'ar' ? 'خدمة توصيل خلال 48 ساعة داخل المملكة' : '48h delivery across KSA',
      icon: 'truck'
    },
    {
      id: 'highlight-returns',
      title: locale === 'ar' ? 'إرجاع مجاني' : 'Free Returns',
      description: locale === 'ar' ? 'إرجاع خلال 14 يوماً دون عناء' : 'Hassle-free 14 day returns',
      icon: 'shield'
    },
    {
      id: 'highlight-support',
      title: locale === 'ar' ? 'دعم مباشر' : 'Live Support',
      description: locale === 'ar' ? 'خدمة عملاء على مدار الساعة' : 'Customer care 24/7',
      icon: 'headset'
    }
  ]), [locale]);

  const highlightItems = useMemo(() => {
    if (Array.isArray(marketing?.features) && marketing.features.length) {
      return marketing.features.slice(0, 4).map((feature, index) => ({
        id: feature.id || `feature-${index}`,
        title: pickLocaleValue(feature.title),
        description: pickLocaleValue(feature.body),
        icon: feature.icon
      }));
    }
    return defaultHighlights;
  }, [marketing?.features, defaultHighlights, pickLocaleValue]);

  const navigate = useNavigate();
  useHeroSwiper();

  return (
    <>
    <section className="slider" role="region" aria-label="Hero banner">

        <div className="container">



            <div className="slide-swp mySwiper">

                <div className="swiper-wrapper">
                  {heroSlides.map((slide, index) => (
                    <div key={slide.id || index} className="swiper-slide">
                      <a href={slide.link || '#'} aria-label={`${slide.title || 'Hero slide'} - View`}>
                        <div className="ad-image-container">
                          <SafeImage
                            src={slide.image || '/images/hero-background.svg'}
                            alt={slide.title || `إعلان ${index + 1}`}
                            className="ad-image"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            fetchPriority={index === 0 ? 'high' : 'low'}
                          />
                        </div>
                        { (slide.title || slide.subtitle || slide.cta) && (
                          <div className="hero-overlay">
                            <div className="hero-overlay__content">
                              {slide.title && <h2 className="home-hero__title">{slide.title}</h2>}
                              {slide.subtitle && <p className="home-hero__lead">{slide.subtitle}</p>}
                              {slide.cta && slide.cta.text && (
                                <button className="hero-cta btn" onClick={(e)=>{ e.preventDefault(); const href = slide.cta.link || slide.link || null; if (href) { navigate(href); } }} aria-label={slide.cta.text}>{slide.cta.text}</button>
                              )}
                            </div>
                          </div>
                        ) }
                      </a>
                    </div>
                  ))}
                </div>
                <div className="swiper-pagination" aria-live="polite" aria-atomic="true"></div>

            </div>


            <div className="banner_2">
                <a href="/" className="store-brand">
                    <div className="brand-logo">
                    <SafeImage
                      src={setting?.logoUrl || setting?.logo || '/images/site-logo.svg'}
                      alt={setting?.siteName || 'Store Logo'}
                      className="logo-image"
                      loading="eager"
                      fetchPriority={'high'}
                    />
                  </div>
                  {(setting?.siteNameAr || setting?.siteNameEn || setting?.siteName) && (
                    <div className="brand-name">
                      <h2 className="store-name">
                        {setting.siteNameAr || setting.siteNameEn || setting.siteName}
                      </h2>
                    </div>
                  )}
                  <button className="shop-now-btn btn justify-center " onClick={()=>{ navigate('/products'); }} aria-label="Shop Now">تسوق الآن</button>
                </a>
                
            </div>

        </div>

    </section>
    <HomeHighlightBar items={highlightItems} loading={marketing?.loading} />
    </>
  )
}
