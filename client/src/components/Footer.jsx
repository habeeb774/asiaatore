// components/Footer.js
import React from 'react';
import { useMarketing } from '../context/MarketingContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';

const Footer = () => {
  const { appLinks = [], byLocation } = useMarketing() || { appLinks: [], byLocation:{ footer:[] } };
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const footerBanners = byLocation?.footer || [];
 
  return (
   
    <footer className="bg-gray-100 mt-12 py-8">
      <div className="container-custom px-4 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Link to="/" className="font-bold text-lg inline-flex items-center gap-2">
            {setting?.logo && <img src={setting.logo} alt={setting?.siteNameAr || setting?.siteNameEn || 'logo'} className="h-6 w-auto object-contain" />}
            <span>{setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية'}</span>
          </Link>
        </div>
        {footerBanners.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
                {footerBanners.slice(0,3).map(b => (
              <a key={b.id} href={b.linkUrl || '#'} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-primary-red transition" onClick={()=>{ try { api.marketingTrack({ event:'click', bannerId: b.id, location: 'footer' }); } catch{} }}>
                {b.image && <img src={b.image} alt={resolveLocalized(b.title, locale) || b.title?.ar || b.title?.en || ''} className="h-10 w-auto rounded object-cover" />}
                <span>{resolveLocalized(b.title, locale) || b.title?.ar || b.title?.en}</span>
              </a>
            ))}
          </div>
        )}
        <div className="mb-4">
          <Link to="/about" className="mx-2">من نحن</Link>
          <Link to="/contact" className="mx-2">اتصل بنا</Link>
          <Link to="/products" className="mx-2">المنتجات</Link>
        </div>
        {appLinks.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
            {appLinks.map(l => (
              <a key={l.id} href={l.url} className="inline-flex items-center gap-2 text-xs px-3 py-2 bg-white border rounded-md shadow-sm hover:shadow transition" rel="noopener noreferrer" target="_blank" onClick={()=>{ try { api.marketingTrackClick('appLink', l.id); } catch{} }}>
                <span className="font-semibold">{l.platform.toUpperCase()}</span>
                <span>{resolveLocalized(l.label, locale) || l.label?.ar || l.label?.en || l.platform}</span>
              </a>
            ))}
          </div>
        )}
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} {setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية'}. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
};

export default Footer;