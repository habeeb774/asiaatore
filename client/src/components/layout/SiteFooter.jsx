import React from 'react';
import SafeImage from '../common/SafeImage';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { resolveLocalized } from '../../utils/locale';
import { Phone, Smartphone, Mail, MessageCircle } from 'lucide-react';



function FooterAbout({ isAr, storeName, logo, aboutLines }) {
  return (
    <div className={`space-y-4 text-slate-700 text-center ${isAr ? 'md:text-right' : 'md:text-left'}`}>
      <div className={`flex justify-center md:justify-start ${isAr ? 'md:justify-end' : 'md:justify-start'}`}>
        <SafeImage src={logo} alt={storeName} className="h-12 w-auto" />
        <span className="sr-only">{storeName}</span>
      </div>
      <div className="text-sm leading-7 space-y-2">
        {aboutLines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function FooterLinks({ t, linkBlog, linkSocial, linkReturns, linkPrivacy, isAr }) {
  return (
    <div className="text-center">
      <h3 className="mb-4 text-lg font-bold text-[#E6A400]">{t.links}</h3>
      <div className={`space-y-2 text-sm text-slate-700 ${isAr ? 'md:text-right' : 'md:text-left'}`}>
        <a href={linkBlog} className="block transition-colors hover:text-[#E6A400]">{t.blog}</a>
        <a href={linkSocial} className="block transition-colors hover:text-[#E6A400]">{t.social}</a>
        <a href={linkReturns} className="block transition-colors hover:text-[#E6A400]">{t.returns}</a>
        <a href={linkPrivacy} className="block transition-colors hover:text-[#E6A400]">{t.privacy}</a>
      </div>
    </div>
  );
}

function FooterSupport({ t, supportWhatsapp, supportMobile, supportPhone, supportEmail }) {
  const items = [
    {
      label: t.whatsapp,
      href: `https://wa.me/${supportWhatsapp}`,
      aria: 'WhatsApp',
      Icon: MessageCircle
    },
    {
      label: t.mobile,
      href: `tel:${supportMobile}`,
      aria: t.mobile,
      Icon: Smartphone
    },
    {
      label: t.phone,
      href: `tel:${supportPhone}`,
      aria: t.phone,
      Icon: Phone
    },
    {
      label: t.email,
      href: `mailto:${supportEmail}`,
      aria: t.email,
      Icon: Mail
    }
  ];

  return (
    <div className="text-center">
      <h3 className="mb-4 text-lg font-bold text-[#E6A400]">{t.support}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, href, aria, Icon }) => (
          <a
            key={label}
            href={href}
            aria-label={aria}
            className="group flex flex-col items-center gap-2 text-sm text-slate-700"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-[#E6A400]">
              <Icon size={18} className="text-slate-600" />
            </span>
            <span>{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterAppBadges({ t, appStoreUrl, playStoreUrl, taxNumber, isAr }) {
  return (
    <div className="text-center">
      <h3 className="mb-4 text-lg font-bold text-[#E6A400]">{t.appTitle}</h3>
      <AppBadges
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
        playBadgeAlt={t.playBadgeAlt}
        appStoreBadgeAlt={t.appStoreBadgeAlt}
        isRtl={isAr}
      />
      <div className="mt-4 text-sm text-slate-700">
        <p className="font-medium">{isAr ? 'الرقم الضريبي' : 'Tax number'}</p>
        <span className="font-semibold tracking-wide">{taxNumber}</span>
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
  const supportPhone = setting?.supportPhone || '920000000';
  const supportMobile = setting?.supportMobile || '+966500000000';
  const supportWhatsapp = setting?.supportWhatsapp || '966500000000';
  const supportWhatsappDigits = (supportWhatsapp || '').replace(/[^0-9]/g, '') || '966500000000';
  const supportEmail = setting?.supportEmail || 'support@example.com';
  const linkBlog = setting?.linkBlog || '#';
  const linkSocial = setting?.linkSocial || '#';
  const linkReturns = setting?.linkReturns || '#';
  const linkPrivacy = setting?.linkPrivacy || '#';
  const appStoreUrl = setting?.appStoreUrl || '#';
  const playStoreUrl = setting?.playStoreUrl || '#';
  const year = new Date().getFullYear();

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
    <footer dir={isAr ? 'rtl' : 'ltr'} className="bg-white border-t border-slate-200">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-10 text-center md:grid-cols-4 md:text-right">
          <FooterAbout
            isAr={isAr}
            storeName={storeName}
            logo={setting?.logoUrl || setting?.logo || '/logo.svg'}
            aboutLines={aboutLines}
          />
          <FooterLinks
            t={t}
            linkBlog={linkBlog}
            linkSocial={linkSocial}
            linkReturns={linkReturns}
            linkPrivacy={linkPrivacy}
            isAr={isAr}
          />
          <FooterSupport
            t={t}
            supportWhatsapp={supportWhatsappDigits}
            supportMobile={supportMobile}
            supportPhone={supportPhone}
            supportEmail={supportEmail}
          />
          <FooterAppBadges
            t={t}
            appStoreUrl={appStoreUrl}
            playStoreUrl={playStoreUrl}
            taxNumber={taxNumber}
            isAr={isAr}
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 border-t border-slate-200 pt-6 text-center md:flex-row md:justify-between md:text-right">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <a
              href="https://eauthenticate.saudibusiness.gov.sa/certificate-details/7029136350"
              target="_blank"
              rel="noreferrer"
              className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              aria-label={isAr ? 'شهادة موثوق' : 'Trusted certificate'}
            >
              <img src="https://cdn.salla.network/images/sbc.png?v=2.0.5" alt="sbc certificate" className="max-h-full" />
            </a>
            <span>{isAr ? 'موثَّق في منصة الأعمال' : 'Verified on the Business Platform'}</span>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-3">
            {[
              { alt: 'mada', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/mada.png' },
              { alt: 'mastercard', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/mastercard.png' },
              { alt: 'visa', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/visa.png' },
              { alt: 'bank transfer', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/bank.png' },
              { alt: 'apple pay', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/apple_pay.png' },
              { alt: 'tabby', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/tabby_installment.png' },
              { alt: 'tamara', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/tamara_installment.png' },
              { alt: 'cash on delivery', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/cod.png' }
            ].map(({ alt, src }) => (
              <li key={alt} className="flex h-8 w-14 items-center justify-center rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                <img src={src} alt={alt} className="max-h-full" />
              </li>
            ))}
          </ul>

          <p className="text-sm text-slate-500">
            {isAr ? `صنع بإتقان على منصة سلة | ${year}` : `Crafted with care on the Salla platform | ${year}`}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
