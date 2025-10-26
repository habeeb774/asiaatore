import React from 'react';
import ReactFullpage from '@fullpage/react-fullpage';
import { useLanguage } from '../../context/LanguageContext';
import { resolveLocalized } from '../../utils/locale';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';

// Minimal FullLanding scaffold with three sections: Hero, Video, Featured Products
export default function FullLanding() {
  const { locale, t } = useLanguage();
  const { products = [] } = useProducts() || {};

  const featured = (Array.isArray(products) ? products.slice(0,6) : []);

  // Read optional Fullpage license key from env. When missing, render a
  // graceful stacked fallback instead of initializing Fullpage which
  // logs repeated warnings in the console.
  const FULLPAGE_KEY = (import.meta && import.meta.env && import.meta.env.VITE_FULLPAGE_KEY) || '';

  const FullpageWrapper = () => {
    // If no license key is configured, avoid rendering ReactFullpage which
    // will log repeated warnings. Instead render a stacked, accessible
    // fallback layout that preserves the hero/video/products content.
    if (!FULLPAGE_KEY) {
      return (
        <div className="full-landing-root stacked-fallback">
          <section id="section-hero" className="py-16">
            <div className="container-custom flex items-center justify-center">
              <div className="text-center max-w-3xl" role="region" aria-label="Hero">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{locale === 'ar' ? 'مرحباً بكم في متجرنا' : (t ? t('welcome') : 'Welcome')}</h1>
                <p className="text-lg opacity-80 mb-6">{locale === 'ar' ? 'تجربة تسوق سلسة ومصممة للمنطقة' : (t ? t('heroLead') : 'A tailored shopping experience')}</p>
                <div className="flex gap-3 justify-center">
                  <Link to={locale === 'ar' ? '/products' : '/en/products'} className="btn-primary px-6 py-3" aria-label={locale==='ar'?'تسوق الآن':'Shop now'}>{locale==='ar'?'تسوق الآن':'Shop now'}</Link>
                  <a href="#section-video" className="btn-secondary px-6 py-3">{locale==='ar'?'عرض الفيديو':'View video'}</a>
                </div>
              </div>
            </div>
          </section>

          <section id="section-video" className="py-12 bg-gray-50">
            <div className="container-custom flex items-center justify-center">
              <div className="max-w-4xl w-full text-center">
                <div style={{position:'relative',paddingTop:'56.25%',overflow:'hidden',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.12)'}}>
                  <iframe
                    title="promo-video"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
                    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <p className="mt-6 opacity-80">{locale==='ar'?'شاهد لمحة عن منتجاتنا وخدماتنا':'Watch a short glimpse of our products and services'}</p>
              </div>
            </div>
          </section>

          <section id="section-products" className="py-12">
            <div className="container-custom">
              <h2 className="text-2xl font-semibold text-center mb-6">{locale==='ar'?'منتجات مميزة':'Featured products'}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featured.map(p => (
                  <Link key={p.id} to={`/product/${p.slug || p.id}`} className="card p-3 bg-white rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2" aria-label={resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en}>
                    <img src={p.image || (p.images && p.images[0]) || '/images/placeholder.png'} alt={resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || ''} className="w-full h-40 object-cover rounded-md mb-3" />
                    <div className="text-sm font-medium">{resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en}</div>
                    <div className="text-xs text-gray-500">{p.price ? `${p.price} ${locale==='ar'?'ر.س':'SAR'}` : ''}</div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to={locale === 'ar' ? '/products' : '/en/products'} className="btn-outline">{locale==='ar'?'عرض الكل':'View all products'}</Link>
              </div>
            </div>
          </section>
        </div>
      );
    }

    // Fullpage mode when key is supplied
    return (
      <ReactFullpage
        licenseKey={FULLPAGE_KEY}
        anchors={["home", "video", "products"]}
        navigation
        navigationPosition={locale === 'ar' ? 'left' : 'right'}
        scrollingSpeed={700}
        render={({ state, fullpageApi }) => {
          return (
            <div id="fullpage-wrapper" className="full-landing-root">
              <div className="section fp-section" id="section-hero">
                <div className="container-custom h-full flex items-center justify-center">
                  <div className="text-center max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{locale === 'ar' ? 'مرحباً بكم في متجرنا' : (t ? t('welcome') : 'Welcome')}</h1>
                    <p className="text-lg opacity-80 mb-6">{locale === 'ar' ? 'تجربة تسوق سلسة ومصممة للمنطقة' : (t ? t('heroLead') : 'A tailored shopping experience')}</p>
                    <div className="flex gap-3 justify-center">
                      <Link to={locale === 'ar' ? '/products' : '/en/products'} className="btn-primary px-6 py-3">{locale==='ar'?'تسوق الآن':'Shop now'}</Link>
                      <button className="btn-secondary px-6 py-3" onClick={() => fullpageApi.moveSectionDown()}>{locale==='ar'?'عرض الفيديو':'View video'}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section fp-section" id="section-video">
                <div className="container-custom h-full flex items-center justify-center">
                  <div className="max-w-4xl w-full text-center">
                    <div style={{position:'relative',paddingTop:'56.25%',overflow:'hidden',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.12)'}}>
                      <iframe
                        title="promo-video"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
                        style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-6 opacity-80">{locale==='ar'?'شاهد لمحة عن منتجاتنا وخدماتنا':'Watch a short glimpse of our products and services'}</p>
                  </div>
                </div>
              </div>

              <div className="section fp-section" id="section-products">
                <div className="container-custom py-12">
                  <h2 className="text-2xl font-semibold text-center mb-6">{locale==='ar'?'منتجات مميزة':'Featured products'}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {featured.map(p => (
                      <Link key={p.id} to={`/product/${p.slug || p.id}`} className="card p-3 bg-white rounded-lg shadow-sm hover:shadow-md">
                        <img src={p.image || (p.images && p.images[0]) || '/images/placeholder.png'} alt={resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || ''} className="w-full h-40 object-cover rounded-md mb-3" />
                        <div className="text-sm font-medium">{resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en}</div>
                        <div className="text-xs text-gray-500">{p.price ? `${p.price} ${locale==='ar'?'ر.س':'SAR'}` : ''}</div>
                      </Link>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link to={locale === 'ar' ? '/products' : '/en/products'} className="btn-outline">{locale==='ar'?'عرض الكل':'View all products'}</Link>
                  </div>
                </div>
              </div>

            </div>
          );
        }}
      />
    );
  };

  return (
    <div className="full-landing">
      <FullpageWrapper />
    </div>
  );
}
