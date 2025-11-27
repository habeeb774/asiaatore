import React from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../common/SafeImage';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { resolveLocalized } from '../../utils/locale';
import { 
  Phone, 
  Smartphone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  Send,
  Sparkles,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones
} from 'lucide-react';

// Feature badges at top of footer
function FooterFeatures({ isAr }) {
  const features = [
    { icon: Truck, labelAr: 'شحن سريع', labelEn: 'Fast Shipping' },
    { icon: ShieldCheck, labelAr: 'دفع آمن', labelEn: 'Secure Payment' },
    { icon: CreditCard, labelAr: 'تقسيط ميسر', labelEn: 'Easy Installments' },
    { icon: Headphones, labelAr: 'دعم 24/7', labelEn: '24/7 Support' },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      {features.map(({ icon: Icon, labelAr, labelEn }, idx) => (
        <div 
          key={idx}
          className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">
            {isAr ? labelAr : labelEn}
          </span>
        </div>
      ))}
    </div>
  );
}

function FooterAbout({ isAr, storeName, logo, aboutLines }) {
  return (
    <div className={`space-y-5 ${isAr ? 'text-right' : 'text-left'}`}>
      <div className={`flex ${isAr ? 'justify-end' : 'justify-start'}`}>
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <SafeImage src={logo} alt={storeName} className="relative h-14 w-auto" />
        </div>
      </div>
      <div className="text-sm leading-7 text-slate-600 space-y-2">
        {aboutLines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      {/* Social Icons */}
      <div className={`flex gap-3 ${isAr ? 'justify-end' : 'justify-start'}`}>
        {[
          { Icon: Facebook, href: '#', label: 'Facebook' },
          { Icon: Twitter, href: '#', label: 'Twitter' },
          { Icon: Instagram, href: '#', label: 'Instagram' },
          { Icon: Youtube, href: '#', label: 'Youtube' },
        ].map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center text-slate-600 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-1"
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterLinks({ t, linkBlog, linkSocial, linkReturns, linkPrivacy, isAr }) {
  const Arrow = isAr ? ChevronLeft : ChevronRight;
  const items = [
    { href: linkBlog, label: t.blog },
    { href: linkSocial, label: t.social },
    { href: linkReturns, label: t.returns },
    { href: linkPrivacy, label: t.privacy }
  ];
  
  return (
    <div className={isAr ? 'text-right' : 'text-left'}>
      <h3 className="mb-5 text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        {t.links}
      </h3>
      <ul className="space-y-3">
        {items.map((it, i) => {
          const isExternal = typeof it.href === 'string' && /^(https?:)?\/\//i.test(it.href) && !it.href.startsWith('/');
          return (
            <li key={i}>
              <a 
                href={it.href} 
                className={`group flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors ${isAr ? 'flex-row-reverse' : ''}`}
                target={isExternal ? '_blank' : undefined} 
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                <Arrow className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FooterSupport({ t, supportWhatsapp, supportMobile, supportPhone, supportEmail, isAr }) {
  const items = [
    {
      label: t.whatsapp,
      href: `https://wa.me/${supportWhatsapp}`,
      aria: 'WhatsApp',
      Icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      shadow: 'shadow-green-200/50'
    },
    {
      label: t.mobile,
      href: `tel:${supportMobile}`,
      aria: t.mobile,
      Icon: Smartphone,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-200/50'
    },
    {
      label: t.phone,
      href: `tel:${supportPhone}`,
      aria: t.phone,
      Icon: Phone,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-200/50'
    },
    {
      label: t.email,
      href: `mailto:${supportEmail}`,
      aria: t.email,
      Icon: Mail,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-200/50'
    }
  ];

  return (
    <div className={isAr ? 'text-right' : 'text-left'}>
      <h3 className="mb-5 text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        {t.support}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, href, aria, Icon, color, shadow }) => (
          <a
            key={label}
            href={href}
            aria-label={aria}
            className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300"
          >
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-lg ${shadow} group-hover:scale-110 transition-transform`}>
              <Icon size={18} className="text-white" />
            </span>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterAppBadges({ t, appStoreUrl, playStoreUrl, taxNumber, isAr }) {
  return (
    <div className={isAr ? 'text-right' : 'text-left'}>
      <h3 className="mb-5 text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        {t.appTitle}
      </h3>
      <AppBadges
        appStoreUrl={appStoreUrl}
        playStoreUrl={playStoreUrl}
        playBadgeAlt={t.playBadgeAlt}
        appStoreBadgeAlt={t.appStoreBadgeAlt}
        isAr={isAr}
      />
      <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
        <p className="text-xs text-slate-500 mb-1">{isAr ? 'الرقم الضريبي' : 'Tax Number'}</p>
        <span className="font-bold text-slate-800 tracking-wide font-mono">{taxNumber}</span>
      </div>
    </div>
  );
}

function AppBadges({ appStoreUrl, playStoreUrl, playBadgeAlt, appStoreBadgeAlt, isAr }) {
  const [gpOk, setGpOk] = React.useState(true);
  const [asOk, setAsOk] = React.useState(true);
  return (
    <div className={`flex flex-wrap gap-3 ${isAr ? 'justify-end' : 'justify-start'}`}>
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center justify-center rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 transition-all hover:shadow-lg hover:-translate-y-1"
        aria-label={playBadgeAlt}
      >
        {gpOk ? (
          <img
            src="/assets/badges/google-play-badge.svg"
            alt={playBadgeAlt}
            className="h-12 object-contain"
            loading="lazy"
            onError={() => setGpOk(false)}
          />
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-white">
            <span className="text-[10px] leading-3 opacity-80">GET IT ON</span>
            <span className="text-sm font-semibold">Google Play</span>
          </span>
        )}
      </a>

      <a
        href={appStoreUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center justify-center rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 transition-all hover:shadow-lg hover:-translate-y-1"
        aria-label={appStoreBadgeAlt}
      >
        {asOk ? (
          <img
            src="/assets/badges/app-store-badge.svg"
            alt={appStoreBadgeAlt}
            className="h-12 object-contain"
            loading="lazy"
            onError={() => setAsOk(false)}
          />
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-white">
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
  // Prefer admin-provided absolute links; otherwise point to internal legal routes so footer always works.
  const linkReturns = setting?.linkReturns || '/legal/returns';
  const linkPrivacy = setting?.linkPrivacy || '/legal/privacy';
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
    <footer dir={isAr ? 'rtl' : 'ltr'} className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Features Section */}
        <div className="py-10 border-b border-slate-100">
          <FooterFeatures isAr={isAr} />
        </div>
        
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid gap-10 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
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
              isAr={isAr}
            />
            <FooterAppBadges
              t={t}
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
              taxNumber={taxNumber}
              isAr={isAr}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-slate-100">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Trust Badge */}
            <div className="flex items-center gap-4">
              <a
                href="https://eauthenticate.saudibusiness.gov.sa/certificate-details/7029136350"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                aria-label={isAr ? 'شهادة موثوق' : 'Trusted certificate'}
              >
                <img 
                  src="https://cdn.salla.network/images/sbc.png?v=2.0.5" 
                  alt="sbc certificate" 
                  className="h-10 w-auto group-hover:scale-105 transition-transform" 
                />
                <span className="text-sm font-medium text-slate-600">
                  {isAr ? 'موثَّق في منصة الأعمال' : 'Verified Business'}
                </span>
              </a>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { alt: 'mada', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/mada.png' },
                { alt: 'mastercard', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/mastercard.png' },
                { alt: 'visa', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/visa.png' },
                { alt: 'apple pay', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/apple_pay.png' },
                { alt: 'tabby', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/tabby_installment.png' },
                { alt: 'tamara', src: 'https://cdn.assets.salla.network/themes/1034648396/1.130.0/images/tamara_installment.png' },
              ].map(({ alt, src }) => (
                <div 
                  key={alt} 
                  className="flex h-9 w-14 items-center justify-center rounded-lg bg-white border border-slate-100 p-1.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>

            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>
                {isAr 
                  ? `© ${year} ${storeName}. جميع الحقوق محفوظة` 
                  : `© ${year} ${storeName}. All rights reserved`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
    </footer>
  );
}

export default SiteFooter;
