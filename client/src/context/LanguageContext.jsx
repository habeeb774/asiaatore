import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import i18n from "../i18n";

const SUPPORTED_LOCALES = ["ar", "en", "fr"];
const DEFAULT_LOCALE = "ar";

const defaultTranslate = (key, options) => {
  if (options && Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
    return options.defaultValue;
  }
  return key;
};

const defaultContextValue = {
  t: defaultTranslate,
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  available: SUPPORTED_LOCALES,
  language: { direction: "rtl" },
};

const LanguageContext = createContext(defaultContextValue);

const normalizeLocale = (value) => {
  if (!value) return DEFAULT_LOCALE;
  const lower = String(value).toLowerCase();
  const direct = SUPPORTED_LOCALES.find((locale) => lower === locale);
  if (direct) return direct;
  const partial = SUPPORTED_LOCALES.find((locale) => lower.startsWith(`${locale}-`));
  return partial || DEFAULT_LOCALE;
};

const resolveIntlLocale = (locale) => {
  if (locale === "ar") return "ar-SA";
  if (locale === "fr") return "fr-FR";
  return "en-US";
};

const detectInitialLocale = () => {
  try {
    return normalizeLocale(i18n.language);
  } catch {
    return DEFAULT_LOCALE;
  }
};

// LocalizedText component for displaying localized text
export const LocalizedText = ({ value, fallback, children, ...props }) => {
  const { locale } = useLanguage();
  let content = children;
  if (value && typeof value === "object") {
    content =
      value[locale] ??
      value[locale === "ar" ? "ar" : "en"] ??
      value.en ??
      value.ar ??
      fallback ??
      children ??
      "";
  } else if (typeof value === "string") {
    content = value;
  } else if (content == null && fallback != null) {
    content = fallback;
  }
  return <span {...props}>{content}</span>;
};

// CurrencyDisplay component for displaying currency
export const CurrencyDisplay = ({
  amount = 0,
  currency = "SAR",
  minimumFractionDigits,
  maximumFractionDigits,
  ...props
}) => {
  const { locale } = useLanguage();
  const formatLocale = resolveIntlLocale(locale);
  const parsedAmount = Number(amount);
  const numericAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const formatOptions = {
    style: "currency",
    currency,
  };
  if (typeof minimumFractionDigits === "number") {
    formatOptions.minimumFractionDigits = minimumFractionDigits;
  }
  if (typeof maximumFractionDigits === "number") {
    formatOptions.maximumFractionDigits = maximumFractionDigits;
  }
  const formatted = new Intl.NumberFormat(formatLocale, formatOptions).format(
    numericAmount
  );
  return <span {...props}>{formatted}</span>;
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(detectInitialLocale);

  useEffect(() => {
    const handleLanguageChange = (next) => {
      setLocaleState(normalizeLocale(next));
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("lang", locale);
    } catch {}
  }, [locale]);

  const setLocale = useCallback((next) => {
    const normalized = normalizeLocale(next);
    if (!normalized) return;
    if (i18n.language !== normalized) {
      void i18n.changeLanguage(normalized).catch(() => {
        setLocaleState(normalized);
      });
    } else {
      setLocaleState(normalized);
    }
  }, []);

  const language = useMemo(
    () => ({ direction: locale === "ar" ? "rtl" : "ltr" }),
    [locale]
  );

  const t = useMemo(() => i18n.t.bind(i18n), [locale]);

  const value = useMemo(
    () => ({
      t,
      locale,
      setLocale,
      available: SUPPORTED_LOCALES,
      language,
    }),
    [language, locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) return defaultContextValue;
  return ctx;
};

// DateDisplay: named export for formatting/displaying dates using current locale
export function DateDisplay({
  date,
  options = { dateStyle: "medium" },
  ...props
}) {
  const { locale } = useLanguage();
  const fmtLocale = resolveIntlLocale(locale);
  const value = date ? new Date(date) : new Date();
  const formatted = new Intl.DateTimeFormat(fmtLocale, options).format(value);
  return <span {...props}>{formatted}</span>;
}
