import React, { createContext, useContext } from 'react';

const LanguageContext = createContext();

// LocalizedText component for displaying localized text
export const LocalizedText = ({ children, ...props }) => {
  return <span {...props}>{children}</span>;
};

// CurrencyDisplay component for displaying currency
export const CurrencyDisplay = ({ amount, currency = 'SAR', ...props }) => {
  const formatted = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  return <span {...props}>{formatted}</span>;
};

export const LanguageProvider = ({ children }) => {
  return (
    <LanguageContext.Provider
      value={{
        t: (k) => k,
        locale: 'ar',
        setLocale: () => {},
        available: ['ar', 'en', 'fr'],
        language: { direction: 'rtl' },
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      t: (k) => k,
      locale: 'ar',
      setLocale: () => {},
      available: ['ar', 'en', 'fr'],
      language: { direction: 'rtl' },
    };
  }
  return {
    ...ctx,
    language: { direction: ctx.locale === 'ar' ? 'rtl' : 'ltr' },
  };
};

// DateDisplay: named export for formatting/displaying dates using current locale
export function DateDisplay({ date, options = { dateStyle: 'medium' }, ...props }) {
  const { locale } = useLanguage();
  const localeMap = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR' };
  const fmtLocale = localeMap[locale] || locale || 'en-US';

  const value = date ? new Date(date) : new Date();
  const formatted = new Intl.DateTimeFormat(fmtLocale, options).format(value);

  return <span {...props}>{formatted}</span>;
}