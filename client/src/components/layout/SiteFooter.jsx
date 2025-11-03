import React from 'react';
import SafeImage from '../common/SafeImage';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { resolveLocalized } from '../../utils/locale';
import { Phone, Smartphone, Mail, MessageCircle } from 'lucide-react';



function FooterAbout({ isAr, storeName, logo, aboutLines }) {
  return (
    <ul className={`footer-about text-slate-700 ${isAr ? 'text-right' : 'text-left'} flex-shrink-0 min-w-[280px] snap-start`}>
      <div className="flex items-center gap-2 mb-3">
          <SafeImage src={logo} alt={storeName} className="h-10 w-auto" />
          <span className="sr-only">{storeName}</span>
        </div>
      <div className="text-sm leading-7 space-y-1">
        {aboutLines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    </ul>
  );
}

function FooterLinks({ t, linkBlog, linkSocial, linkReturns, linkPrivacy }) {
  return (
    <ul className="footer-links text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[220px] snap-start">
  <h3 className="mb-3 text-base font-extrabold" style={{ color: 'var(--brand-orange)' }}>{t.links}</h3>
      <ul className="space-y-2 text-sm">
        <li><a href={linkBlog} className="footer-link hover:text-slate-900">{t.blog}</a></li>
        <li><a href={linkSocial} className="footer-link hover:text-slate-900">{t.social}</a></li>
        <li><a href={linkReturns} className="footer-link hover:text-slate-900">{t.returns}</a></li>
        <li><a href={linkPrivacy} className="footer-link hover:text-slate-900">{t.privacy}</a></li>
      </ul>
    </ul>
  );
}

function FooterSupport({ t, chatPath, supportMobile, supportPhone, supportEmail }) {
  return (
    <div className="footer-support text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[220px] sm:min-w-[260px] snap-start">
  <h3 className="mb-3 text-base font-extrabold" style={{ color: 'var(--brand-orange)' }}>{t.support}</h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 justify-items-center md:flex md:flex-wrap md:justify-center">
        <Link to={chatPath} aria-label={t.chat} className="footer-support-link inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
          <span className="footer-icon flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><MessageCircle size={16} /></span>
          <span className="hidden sm:inline">{t.chat}</span>
        </Link>
        <a href={`tel:${supportMobile}`} aria-label={t.mobile} className="footer-support-link inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
          <span className="footer-icon flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Smartphone size={16} /></span>
          <span className="hidden sm:inline">{t.mobile}</span>
        </a>
        <a href={`tel:${supportPhone}`} aria-label={t.phone} className="footer-support-link inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
          <span className="footer-icon flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Phone size={16} /></span>
          <span className="hidden sm:inline">{t.phone}</span>
        </a>
        <a href={`mailto:${supportEmail}`} aria-label={t.email} className="footer-support-link inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-none text-slate-800 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-shadow hover:shadow-sm">
          <span className="footer-icon flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 w-8 h-8 sm:w-9 sm:h-9 transition-colors"><Mail size={16} /></span>
          <span className="hidden sm:inline">{t.email}</span>
        </a>
      </div>
    </div>
  );
}

function FooterAppBadges({ t, appStoreUrl, playStoreUrl, isRtl, taxNumber }) {
  return (
    <div className="footer-app-badges text-slate-700 text-center border-s border-slate-200 ps-6 md:ps-8 flex-shrink-0 min-w-[260px] snap-start">
  <h3 className="mb-3 text-base font-extrabold" style={{ color: 'var(--brand-orange)' }}>{t.appTitle}</h3>
      <AppBadges
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
        playBadgeAlt={t.playBadgeAlt}
        appStoreBadgeAlt={t.appStoreBadgeAlt}
        isRtl={isRtl}
      />
      <div className="text-center">
        <div className="text-sm text-slate-700 mb-1">{isRtl ? 'الرقم الضريبي' : 'Tax number'}</div>
        <div className="text-sm font-semibold tracking-wide">{taxNumber}</div>
      </div>
    </div>
  );
}

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

const SiteFooter = () => {
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const isAr = locale === 'ar';
  const storeName = resolveLocalized(setting?.siteName, locale) || (isAr ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store'));
  const taxNumber = setting?.taxNumber || '311307460300003';
  const address = (isAr ? setting?.addressAr : setting?.addressEn) || '';
  const reg = setting?.commercialRegNo || '';
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
  const chatPath = isAr ? '/chat' : (locale === 'en' ? '/en/chat' : '/fr/chat');

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

  // Settings may store localized values either as separate keys (footerAboutAr/footerAboutEn)
  // or as a localized object under `footerAbout`. Resolve both shapes safely.
  const aboutRaw = setting?.footerAbout ?? (isAr ? setting?.footerAboutAr : setting?.footerAboutEn) ?? '';
  const aboutResolved = resolveLocalized(aboutRaw, locale);
  const aboutLines = (aboutResolved?.trim())
    ? (isAr ? aboutResolved.split(/\r?\n/).filter(Boolean) : [aboutResolved])
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
    <footer className="site-footer mt-12 bg-gradient-to-r from-white/90 via-[#F6FFF0] to-white/90 border-t border-slate-200">
      <div className="container-custom px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <FooterAbout isAr={isAr} storeName={storeName} logo={setting?.logoUrl || setting?.logo || '/logo.svg'} aboutLines={aboutLines} />
          </div>

          <div className="md:col-span-2">
            <FooterLinks t={t} linkBlog={linkBlog} linkSocial={linkSocial} linkReturns={linkReturns} linkPrivacy={linkPrivacy} />
          </div>

          <div className="md:col-span-3">
            <FooterSupport t={t} chatPath={chatPath} supportMobile={supportMobile} supportPhone={supportPhone} supportEmail={supportEmail} />
          </div>

          <div className="md:col-span-3">
            <FooterAppBadges t={t} appStoreUrl={appStoreUrl} playStoreUrl={playStoreUrl} isRtl={isAr} taxNumber={taxNumber} />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-700">
              <span className="block md:inline">© {new Date().getFullYear()} {storeName}.</span>
              <span className="hidden md:inline">&nbsp;{isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</span>
              {(address || reg) && (
                <span className="block md:inline ms-2">
                  {isAr ? 'العنوان' : 'Address'}: {address || '-'}{reg ? ` · ${isAr ? 'السجل التجاري' : 'CR'}: ${reg}` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a href={linkSocial} className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40 rounded-md px-2 py-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-90"><path d="M22 5.924c-.68.302-1.412.505-2.183.597.786-.47 1.39-1.213 1.674-2.1-.734.435-1.549.75-2.415.921C18.5 4.17 17.45 3.7 16.273 3.7c-2.06 0-3.735 1.674-3.735 3.735 0 .293.034.578.096.85C9.69 7.947 7.12 6.53 5.07 4.368c-.321.55-.505 1.19-.505 1.87 0 1.29.656 2.427 1.654 3.092-.61-.02-1.188-.188-1.69-.47v.05c0 1.8 1.28 3.297 2.978 3.64-.312.084-.64.129-.978.129-.24 0-.474-.024-.699-.066.475 1.486 1.854 2.57 3.488 2.6-1.279 1.003-2.892 1.602-4.645 1.602-.302 0-.6-.018-.895-.053C6.467 21.04 8.244 21.7 10.17 21.7c6.444 0 9.968-5.34 9.968-9.97 0-.152-.004-.304-.01-.455.68-.49 1.27-1.1 1.74-1.8-.626.28-1.3.468-2 .573z"/></svg>
                <span className="sr-only">{isAr ? 'مواقع التواصل' : 'Social'}</span>
              </a>

              <a href={linkPrivacy} className="text-sm text-slate-700 hover:text-slate-900 underline">
                {isAr ? 'الشروط والخصوصية' : 'Privacy & Terms'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
