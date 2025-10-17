import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { Phone, Smartphone, Mail, MessageCircle } from 'lucide-react';
import logo from '/logo.svg';

const SiteFooter = () => {
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const isAr = locale === 'ar';
  const storeName = isAr ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const taxNumber = setting?.taxNumber || '311307460300003';
  const supportPhone = setting?.supportPhone || '920000000';
  const supportMobile = setting?.supportMobile || '+966500000000';
  const supportWhatsapp = setting?.supportWhatsapp || '966500000000';
  const supportEmail = setting?.supportEmail || 'support@example.com';
  const linkBlog = setting?.linkBlog || '#';
  const linkSocial = setting?.linkSocial || '#';
  const linkReturns = setting?.linkReturns || '#';
  const linkPrivacy = setting?.linkPrivacy || '#';
  const appStoreUrl = setting?.appStoreUrl || '#';
  const playStoreUrl = setting?.playStoreUrl || '#';

  const t = {
    appTitle: isAr ? `تطبيق ${storeName}` : `${storeName} App`,
    support: isAr ? 'خدمة العملاء' : 'Customer Service',
    links: isAr ? 'روابط تهمك' : 'Useful Links',
    blog: isAr ? 'المدونة' : 'Blog',
    social: isAr ? 'مواقع التواصل الاجتماعي' : 'Social Media',
    returns: isAr ? 'سياسة الإستبدال والإسترجاع' : 'Return & Exchange Policy',
    privacy: isAr ? 'سياسة الاستخدام والخصوصية' : 'Privacy & Terms',
    phone: isAr ? 'هاتف' : 'Phone',
    mobile: isAr ? 'جوال' : 'Mobile',
    whatsapp: isAr ? 'واتساب' : 'WhatsApp',
    chat: isAr ? 'الدردشة' : 'Chat',
    email: isAr ? 'إيميل' : 'Email',
    playBadgeAlt: isAr ? 'احصل عليه من Google Play' : 'Get it on Google Play',
    appStoreBadgeAlt: isAr ? 'حمّل من App Store' : 'Download on the App Store'
  };

  const chatPath = isAr ? '/chat' : (locale === 'en' ? '/en/chat' : '/fr/chat');

  const aboutFromSettings = isAr ? (setting?.footerAboutAr || '') : (setting?.footerAboutEn || '');
  const aboutLines = (aboutFromSettings?.trim())
    ? (isAr ? aboutFromSettings.split(/\r?\n/).filter(Boolean) : [aboutFromSettings])
    : (isAr
      ? [
          'متخصصون في بيع المواد الغذائية بالجملة وبالحبة',
          'وجميع احتياجات المنزل من منظفات و كماليات',
          'أيضًا يوجد لدينا قسم السوبر ماركت وجميع',
          'احتياجات الأسرة السعودية وأسعارنا جملة وجودتنا',
          'أصلية'
        ]
      : [
          'We specialize in wholesale and retail food products and home essentials. We also have a supermarket section to cover family needs with genuine quality at great prices.'
        ]
    );

  return (
    <footer className="mt-10 border-t border-slate-200 bg-[rgba(250,250,250,0.65)]">
      <div className="container-custom px-4 py-8">
  <div className="relative scroll-fade-x flex flex-row flex-nowrap items-start gap-6 sm:gap-8 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory hide-scrollbar md:overflow-visible">
          {/* About + logo (first column) */}
          <ul className={`text-slate-700 ${isAr ? 'text-right' : 'text-left'} flex-shrink-0 min-w-[280px] snap-start`}>
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt={storeName} className="h-10 w-auto" />
              <span className="sr-only">{storeName}</span>
            </div>
            <div className="text-sm leading-7 space-y-1">
              {aboutLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </ul>

          {/* Useful links (second column) */}
          <ul className="text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[220px] snap-start">
            <h3 className="mb-3 text-base font-extrabold text-amber-600">{t.links}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href={linkBlog} className="hover:text-slate-900">{t.blog}</a></li>
              <li><a href={linkSocial} className="hover:text-slate-900">{t.social}</a></li>
              <li><a href={linkReturns} className="hover:text-slate-900">{t.returns}</a></li>
              <li><a href={linkPrivacy} className="hover:text-slate-900">{t.privacy}</a></li>
            </ul>
          </ul>

          {/* Customer service (third column) */}
          <div className="text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[220px] sm:min-w-[260px] snap-start">
            <h3 className="mb-3 text-base font-extrabold text-amber-600">{t.support}</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 justify-items-center md:flex md:flex-wrap md:justify-center">
              <Link to={chatPath} aria-label={t.chat} className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
                <span className="flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><MessageCircle size={16} /></span>
                <span className="hidden sm:inline">{t.chat}</span>
              </Link>
              <a href={`tel:${supportMobile}`} aria-label={t.mobile} className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
                <span className="flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Smartphone size={16} /></span>
                <span className="hidden sm:inline">{t.mobile}</span>
              </a>
              <a href={`tel:${supportPhone}`} aria-label={t.phone} className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
                <span className="flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Phone size={16} /></span>
                <span className="hidden sm:inline">{t.phone}</span>
              </a>
              <a href={`mailto:${supportEmail}`} aria-label={t.email} className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
                <span className="flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Mail size={16} /></span>
                <span className="hidden sm:inline">{t.email}</span>
              </a>
            </div>
          </div>

          {/* App badges + tax number (fourth column) */}
          <div className="text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[260px] snap-start">
            <h3 className="mb-3 text-base font-extrabold text-amber-600">{t.appTitle}</h3>
            <AppBadges
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
              playBadgeAlt={t.playBadgeAlt}
              appStoreBadgeAlt={t.appStoreBadgeAlt}
              isRtl={isAr}
            />
            <div className="text-center">
              <div className="text-sm text-slate-700 mb-1">{isAr ? 'الرقم الضريبي' : 'Tax number'}</div>
              <div className="text-sm font-semibold tracking-wide">{taxNumber}</div>
            </div>
          </div>
        </div>
        {/* Bottom divider under the row on desktop */}
        <div className="mt-6 border-t border-slate-200" />
      </div>
    </footer>
  );
};

export default SiteFooter;

// Inline helper component for app store badges with graceful fallback
function AppBadges({ appStoreUrl, playStoreUrl, playBadgeAlt, appStoreBadgeAlt, isRtl }) {
  const [gpOk, setGpOk] = React.useState(true);
  const [asOk, setAsOk] = React.useState(true);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-md active:shadow"
        aria-label={playBadgeAlt}
      >
        {gpOk ? (
          <img
            src="/assets/badges/google-play-badge.svg"
            alt={playBadgeAlt}
            className="h-11 md:h-12 object-contain transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-0 group-hover:brightness-110"
            loading="lazy"
            onError={() => setGpOk(false)}
          />
        ) : (
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-black px-3 py-2 text-white transition-colors hover:border-slate-400">
            <span className="text-[10px] leading-3 opacity-80">GET IT ON</span>
            <span className="text-sm font-semibold">Google Play</span>
          </span>
        )}
      </a>

      <a
        href={appStoreUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-md active:shadow"
        aria-label={appStoreBadgeAlt}
      >
        {asOk ? (
          <img
            src="/assets/badges/app-store-badge.svg"
            alt={appStoreBadgeAlt}
            className="h-11 md:h-12 object-contain transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-0 group-hover:brightness-110"
            loading="lazy"
            onError={() => setAsOk(false)}
          />
        ) : (
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-black px-3 py-2 text-white transition-colors hover:border-slate-400">
            <span className="text-[10px] leading-3 opacity-80">Download on the</span>
            <span className="text-sm font-semibold">App Store</span>
          </span>
        )}
      </a>
    </div>
  );
}
