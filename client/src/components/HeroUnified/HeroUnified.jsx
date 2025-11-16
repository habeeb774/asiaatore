import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import '../../styles/HeroUnified.css'
import '../../styles/swiper.css'
import '../../styles/all.css'
import { useHeroSwiper } from './swiper'
import ProductSlider from '../products/ProductSlider'
import SafeImage from '../common/SafeImage'
import { useAds } from '../../hooks/useAds'
import { useSettings } from '../../stores/SettingsContext'

export default function HeroUnified(){
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // استخدام useAds hook إذا كان متوفراً
  const { data: adsData = [] } = useAds({
    enabled: true
  });

  // جلب إعدادات المتجر
  const { setting } = useSettings();

  useEffect(() => {
    if (adsData && adsData.length > 0) {
      setAds(adsData);
    } else {
      // بيانات افتراضية في حالة عدم وجود إعلانات
      setAds([
        {
          id: 1,
          title: 'إعلان 1',
          image: '/images/hero-background.svg',
          link: '/products'
        },
        {
          id: 2,
          title: 'إعلان 2',
          image: '/images/hero-background.svg',
          link: '/offers'
        }
      ]);
    }
    setLoading(false);
  }, [adsData]);

  const navigate = useNavigate();
  useHeroSwiper();

  if (loading) {
    return <div className="slider"><div className="container">جاري تحميل الإعلانات...</div></div>;
  }

  return (
    <section className="slider" role="region" aria-label="Hero banner">

        <div className="container">



            <div className="slide-swp mySwiper">

                <div className="swiper-wrapper">
                  {ads.map((ad, index) => (
                    <div key={ad.id || index} className="swiper-slide">
                      <a href={ad.link || '#'} aria-label={`${ad.title || 'Hero slide'} - View`}>
                        <div className="ad-image-container">
                          <SafeImage
                            src={ad.image || '/images/hero-background.svg'}
                            alt={ad.title || `إعلان ${index + 1}`}
                            className="ad-image"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            fetchPriority={index === 0 ? 'high' : 'low'}
                          />
                        </div>
                        { (ad.title || ad.subtitle || ad.cta) && (
                          <div className="hero-overlay">
                            <div className="hero-overlay__content">
                              {ad.title && <h2 className="home-hero__title">{ad.title}</h2>}
                              {ad.subtitle && <p className="home-hero__lead">{ad.subtitle}</p>}
                              {ad.cta && ad.cta.text && (
                                <button className="hero-cta btn" onClick={(e)=>{ e.preventDefault(); const href = ad.cta.link || ad.link || null; if (href) { navigate(href); } }} aria-label={ad.cta.text}>{ad.cta.text}</button>
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
  )
}