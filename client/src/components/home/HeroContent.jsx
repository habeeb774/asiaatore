import React from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage';

export default function HeroContent({ siteName, locale, t, baseProductsPath, setting, heroVisual }) {
  return (
    <div className="container mx-auto relative px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="pointer-events-none absolute inset-0 opacity-[.06]" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%,#fff,transparent 40%), radial-gradient(ellipse at 80% 100%,#fff,transparent 40%)' }} />

      <div className="flex-1 min-h-[340px] grid grid-cols-1 lg:grid-cols-2 items-center">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.28, ease: 'easeOut' }} className="w-full max-w-[720px] flex gap-5 items-center justify-center lg:justify-start">
          <div className={`flex-1 min-w-0 flex flex-col gap-4 ${locale === 'ar' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-3">
              <SafeImage src={setting?.logoUrl || setting?.logo || '/images/site-logo.svg'} alt={siteName || 'Logo'} className="h-12 w-auto object-contain" />
            </div>

            <div className={`flex flex-col gap-2 ${locale === 'ar' ? 'items-end' : 'items-start'}`}>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-3 py-1 rounded-full font-bold text-sm shadow-md">{locale === 'ar' ? 'خصومات حتى 30٪' : 'Up to 30% off'}</div>
              <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                <span className="block">{siteName || t('heroTitle')}</span>
                <small className="block text-xl sm:text-2xl font-semibold opacity-90 mt-2">{t('heroSubtitle')}</small>
              </h1>
              <div className="text-white max-w-[420px] opacity-95 mt-3 leading-relaxed">{t('heroLead')}</div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 z-40 relative">
              <Link to={baseProductsPath} className="inline-flex items-center justify-center bg-white text-primary-800 px-6 py-3 rounded-lg font-bold shadow-xl transform hover:-translate-y-0.5 transition" aria-label={locale === 'ar' ? 'تسوق الآن' : 'Shop now'}>
                {t('shopNow') || t('shop_now')}
              </Link>
              <Link to="/offers" className="inline-flex items-center justify-center bg-white/10 text-white px-5 py-3 rounded-lg border border-white/20 font-semibold hover:bg-white/12 transition" aria-label={locale === 'ar' ? 'تصفح العروض' : 'View offers'}>
                {t('viewOffers') || t('view_offers')}
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-6" role="list" aria-label={locale==='ar'?'مزايا المتجر':'Store benefits'}>
              <div className="flex items-center gap-3" role="listitem">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7h13v13H3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                <div className="text-sm text-white">{locale==='ar'?'شحن موثوق':'Trusted shipping'}</div>
              </div>
              <div className="flex items-center gap-3" role="listitem">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l7 3v5c0 5-3.6 9-7 11-3.4-2-7-6-7-11V5l7-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                <div className="text-sm text-white">{locale==='ar'?'جودة مضمونة':'Quality assured'}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating product showcase for visual interest on larger screens */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-[360px] relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-white/5 border border-white/10" style={{backdropFilter:'blur(6px)'}}>
              <SafeImage src={heroVisual?.src || '/images/hero-image.svg'} alt={heroVisual?.alt || 'Hero'} className="w-full h-64 object-cover" />
              <div className="p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                <div className="font-bold text-lg">{heroVisual?.alt || siteName}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xl font-extrabold">{setting?.currencySymbol || 'SAR'} {setting?.heroPrice || ''}</div>
                  <Link to={baseProductsPath} className="inline-block bg-white text-black rounded-md px-3 py-2 font-semibold">{locale==='ar'?'عرض المنتج':'View'}</Link>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 right-6 text-white text-xs bg-black/40 backdrop-blur rounded-full px-3 py-1">{locale==='ar'?'شحن سريع':'Fast shipping'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
