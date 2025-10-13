import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AnnouncementBar = () => {
  const { locale } = useLanguage();
  const msg = locale === 'ar'
    ? 'شحن سريع وخيارات دفع متعددة'
    : 'Split your purchases via Tabby & Tamara – Fast shipping & flexible payments';
  return (
    <div className="announcement-bar-modern" role="note">
      <div className="announcement-inner">
        <span className="announcement-text">{msg}</span>
      </div>
    </div>
  );
};
export default AnnouncementBar;
