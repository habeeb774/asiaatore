import React from 'react';
import { useLanguage } from '../../stores/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { locale, setLocale, available } = useLanguage();
  return (
    <select
      aria-label="Change language"
      className={className}
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6 }}
    >
      {available.map((lc) => (
        <option key={lc} value={lc}>
          {lc === 'ar' ? 'العربية' : lc === 'en' ? 'English' : lc === 'fr' ? 'Français' : lc}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
