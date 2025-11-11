import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, LocalizedText, LanguageSwitcher } from '../../contexts/LanguageContext';
import { LazyImage } from '../shared/LazyImage/LazyImage';

const Footer = () => {
  const { t, language } = useLanguage();

  const footerLinks = {
    company: [
      { name: t('about'), path: '/about' },
      { name: t('contact'), path: '/contact' },
      { name: t('careers'), path: '/careers' },
      { name: t('press'), path: '/press' }
    ],
    customerService: [
      { name: t('helpCenter'), path: '/help' },
      { name: t('shippingInfo'), path: '/shipping' },
      { name: t('returns'), path: '/returns' },
      { name: t('sizeGuide'), path: '/size-guide' },
      { name: t('trackOrder'), path: '/track-order' }
    ],
    shopping: [
      { name: t('products'), path: '/products' },
      { name: t('categories'), path: '/categories' },
      { name: t('sale'), path: '/sale' },
      { name: t('newArrivals'), path: '/new-arrivals' },
      { name: t('brands'), path: '/brands' }
    ],
    legal: [
      { name: t('privacyPolicy'), path: '/privacy' },
      { name: t('termsOfService'), path: '/terms' },
      { name: t('cookiePolicy'), path: '/cookies' },
      { name: t('accessibility'), path: '/accessibility' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: 'facebook', url: 'https://facebook.com/mystore' },
    { name: 'Twitter', icon: 'twitter', url: 'https://twitter.com/mystore' },
    { name: 'Instagram', icon: 'instagram', url: 'https://instagram.com/mystore' },
    { name: 'YouTube', icon: 'youtube', url: 'https://youtube.com/mystore' },
    { name: 'LinkedIn', icon: 'linkedin', url: 'https://linkedin.com/company/mystore' }
  ];

  const paymentMethods = [
    { name: 'Visa', icon: '/payment-icons/visa.svg' },
    { name: 'Mastercard', icon: '/payment-icons/mastercard.svg' },
    { name: 'PayPal', icon: '/payment-icons/paypal.svg' },
    { name: 'Apple Pay', icon: '/payment-icons/apple-pay.svg' },
    { name: 'Google Pay', icon: '/payment-icons/google-pay.svg' },
    { name: 'Mada', icon: '/payment-icons/mada.svg' }
  ];

  return (
    <footer className={`bg-gray-900 text-white ${language.direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Main Footer Content */}
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 big_row">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <LazyImage
                src="/logo-white.png"
                alt="MyStore Logo"
                className="logo_footer"
                fallbackSrc="/logo.png"
              />
              <span className="text-xl font-bold">MyStore</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {t('footerDescription')}
            </p>

            {/* Newsletter Signup */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{t('newsletter')}</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className={`flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    language.direction === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                  dir={language.direction}
                />
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap">
                  {t('subscribe')}
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {t('newsletterDisclaimer')}
              </p>
            </div>

            {/* Social Links */}
            <div className="icons_footer">
              <h3 className="text-lg font-semibold mb-3">{t('followUs')}</h3>
              <div className="flex space-x-4 rtl:space-x-reverse">
                {socialLinks.map((social) => (
                  <a
                    key={social.icon}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="row">
            <h3 className="text-lg font-semibold mb-4">{t('company')}</h3>
            <ul className="space-y-2 links">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="row">
            <h3 className="text-lg font-semibold mb-4">{t('customerService')}</h3>
            <ul className="space-y-2 links">
              {footerLinks.customerService.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shopping Links */}
          <div className="row">
            <h3 className="text-lg font-semibold mb-4">{t('shopping')}</h3>
            <ul className="space-y-2 links">
              {footerLinks.shopping.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="row">
            <h3 className="text-lg font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2 links">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Language Switcher */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">{t('language')}</h4>
              <LanguageSwitcher variant="dropdown" className="w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods & Security */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Payment Methods */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">{t('acceptedPayments')}</h4>
              <div className="flex flex-wrap gap-3 payment_img">
                {paymentMethods.map((method) => (
                  <LazyImage
                    key={method.name}
                    src={method.icon}
                    alt={method.name}
                    className="h-8 w-auto filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
                    fallbackSrc={`/payment-icons/${method.name.toLowerCase()}-fallback.svg`}
                  />
                ))}
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-400">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1L3 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V4l-7-3z" clipRule="evenodd" />
                </svg>
                <span>{t('secureCheckout')}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-400">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('verifiedSSL')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bottom_footer">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} MyStore. {t('allRightsReserved')}
            </div>
            <div className="flex items-center space-x-6 rtl:space-x-reverse text-sm text-gray-400">
              <span>{t('madeWithLove')}</span>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <span>🇸🇦</span>
                <span>{t('proudlySaudi')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Social Icon Component
const SocialIcon = ({ icon }) => {
  const icons = {
    facebook: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C8.396 0 7.996.014 6.79.067 5.59.12 4.694.265 3.923.51c-.86.28-1.587.65-2.313 1.376C.877 2.612.508 3.338.228 4.198c-.245.77-.39 1.666-.443 2.866C-.01 8.37 0 8.77 0 12.39s-.014 3.994-.067 5.2c-.053 1.206-.188 2.102-.433 2.872-.28.86-.65 1.587-1.376 2.313C.612 23.123 1.338 23.492 2.198 23.772c.77.245 1.666.39 2.866.443C3.62 23.99 4.02 24 7.64 24s3.994-.014 5.2-.067c1.206-.053 2.102-.188 2.872-.433.86-.28 1.587-.65 2.313-1.376.726-.726 1.095-1.453 1.375-2.313.245-.77.39-1.666.443-2.866.057-1.206.067-1.606.067-5.227s.01-3.994.057-5.2c.053-1.206.188-2.102.433-2.872.28-.86.65-1.587 1.376-2.313C23.388.877 23.757.508 24.228.228c.77-.245 1.666-.39 2.866-.443C20.38.01 19.98 0 16.36 0s-3.994.014-5.2.067c-1.206.053-2.102.188-2.872.433-.86.28-1.587.65-2.313 1.376C.877 1.388.508 1.757.228 2.617c-.245.77-.39 1.666-.443 2.866C.01 7.03 0 7.43 0 11.05s-.014 3.994-.067 5.2c-.053 1.206-.188 2.102-.433 2.872-.28.86-.65 1.587-1.376 2.313C.612 22.612.508 23.338.228 24.198c-.245.77-.39 1.666-.443 2.866-.057 1.206-.067 1.606-.067 5.227s.01 3.994.057 5.2c.053 1.206.188 2.102.433 2.872.28.86.65 1.587 1.376 2.313.726.726 1.095 1.453 1.375 2.313.245.77.39 1.666.443 2.866.057 1.206.067 1.606.067 5.227zM12.017 5.84c-3.27 0-5.917 2.647-5.917 5.917 0 3.27 2.647 5.917 5.917 5.917s5.917-2.647 5.917-5.917c0-3.27-2.647-5.917-5.917-5.917zm0 9.804c-2.122 0-3.847-1.725-3.847-3.847s1.725-3.847 3.847-3.847 3.847 1.725 3.847 3.847-1.725 3.847-3.847 3.847zm6.403-10.966c-.76 0-1.377-.617-1.377-1.377s.617-1.377 1.377-1.377 1.377.617 1.377 1.377-.617 1.377-1.377 1.377z"/>
      </svg>
    ),
    youtube: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  };

  return icons[icon] || null;
};

export default Footer;