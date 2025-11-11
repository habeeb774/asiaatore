import React, { createContext, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  return (
    <LanguageContext.Provider value={{
      t: (k) => k,
      locale: 'ar',
      setLocale: () => {},
      available: ['ar', 'en', 'fr'],
      language: { direction: 'rtl' }
    }}>
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
      language: { direction: 'rtl' }
    };
  }
  return {
    ...ctx,
    language: { direction: ctx.locale === 'ar' ? 'rtl' : 'ltr' }
  };
};
