import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr }
};

const detect = () => {
  try {
    const fromStorage = localStorage.getItem('lang');
    const html = document?.documentElement?.lang;
    const nav = navigator?.language || navigator?.languages?.[0];
    const pick = (fromStorage || html || nav || 'ar').slice(0,2).toLowerCase();
    return ['ar','en','fr'].includes(pick) ? pick : 'en';
  } catch {
    return 'ar';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detect(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false
  });

export default i18n;