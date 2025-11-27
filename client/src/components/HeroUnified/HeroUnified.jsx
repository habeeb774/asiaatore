import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { motion } from "../../lib/framerLazy";
import "../../styles/HeroUnified.css";
import "../../styles/swiper.css";
import "../../styles/all.css";
import { useHeroSwiper } from "./swiper";
import SafeImage from "../common/SafeImage";
import { useSettings } from "../../contexts/SettingsContext";
import { useMarketing } from "../../contexts/MarketingContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAds } from "../../hooks/useAds";
import HomeHighlightBar from "../home/HomeHighlightBar";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, rgba(120, 140, 214, 0.95) 0%, rgba(14,116,144,0.92) 52%, rgba(37,99,235,0.9) 100%)";

const DEFAULT_IMAGE_OVERLAY =
  "linear-gradient(135deg, rgba(15,23,42,0.68) 0%, rgba(15,23,42,0.32) 48%, rgba(15,23,42,0.65) 100%)";

const heroCardVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const heroMediaVariants = {
  hidden: { opacity: 0.35, scale: 1.04 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const heroOverlayVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const heroOverlayItemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const heroActionsVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const classicSlideVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const classicOverlayVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.07,
    },
  },
};

const sanitizeId = (value) =>
  String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");

const navigateToLink = (navigate, link) => {
  if (!link || link === "#") return;
  if (/^https?:/i.test(link)) {
    window.location.href = link;
    return;
  }
  navigate(link);
};

export default function HeroUnified({
  slides: slidesProp,
  highlightItems: highlightProp,
  variant = "elegant",
  elegant,
  backgroundGradient,
  showIndicators = true,
  autoplayDelay = 4200,
  accentColor,
  className = "",
} = {}) {
  const { setting } = useSettings();
  const marketing = useMarketing?.() || {};
  const { locale = "ar" } = useLanguage() || {};
  const navigate = useNavigate();

  const sliderIdRef = useRef(
    `hero-swp-${Math.random().toString(36).slice(2, 9)}`
  );
  const sliderDomId = sanitizeId(sliderIdRef.current);

  const isElegant = elegant ?? variant === "elegant";
  const accent =
    accentColor ||
    setting?.theme?.primaryColor ||
    setting?.primaryColor ||
    setting?.mainColor ||
    "#10b981";

  const heroBackgroundImage = (setting?.heroBackgroundImage || "").trim();
  const heroGradient =
    backgroundGradient ||
    setting?.heroBackgroundGradient ||
    setting?.theme?.heroGradient ||
    DEFAULT_GRADIENT;
  const overlayGradient =
    heroBackgroundImage && !(backgroundGradient || setting?.heroBackgroundGradient)
      ? DEFAULT_IMAGE_OVERLAY
      : heroGradient;
  const safeBackgroundImage = heroBackgroundImage
    ? heroBackgroundImage.replace(/"/g, '\\"')
    : "";
  const combinedBackground = heroBackgroundImage
    ? `${overlayGradient}, url("${safeBackgroundImage}")`
    : overlayGradient;

  const homepageBanners = useMemo(() => {
    if (Array.isArray(slidesProp) && slidesProp.length) return [];
    const source = marketing?.byLocation?.homepage?.length
      ? marketing.byLocation.homepage
      : Array.isArray(marketing?.banners)
      ? marketing.banners.filter(
          (banner) => !banner.location || banner.location === "homepage"
        )
      : [];
    return Array.isArray(source) ? source : [];
  }, [marketing?.byLocation, marketing?.banners, slidesProp]);

  const shouldLoadAds = !(Array.isArray(slidesProp) && slidesProp.length);
  const { data: heroAds = [] } = useAds({ enabled: shouldLoadAds });

  const pickLocaleValue = useCallback(
    (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (locale === "ar")
        return value.ar || value.arSA || value.en || value.default || "";
      if (locale === "en")
        return value.en || value.enUS || value.ar || value.default || "";
      return value.default || value.en || value.ar || "";
    },
    [locale]
  );

  const defaultSlides = useMemo(
    () => [
      {
        id: "default-1",
        title:
          locale === "ar" ? "تسوّق أحدث الإصدارات" : "Shop the latest arrivals",
        subtitle:
          locale === "ar"
            ? "عروض حصرية مع شحن سريع لجميع المناطق"
            : "Exclusive drops with premium next-day delivery",
        image: "/images/hero-background.svg",
        link: "/products",
        cta: {
          text: locale === "ar" ? "ابدأ التسوق" : "Start shopping",
          link: "/products",
        },
        badge: locale === "ar" ? "مميز" : "Featured",
      },
      {
        id: "default-2",
        title:
          locale === "ar" ? "خصومات نهاية الأسبوع" : "Weekend special offers",
        subtitle:
          locale === "ar"
            ? "وفر حتى 40٪ على مختاراتنا المنسقة بعناية"
            : "Save up to 40% on carefully curated picks",
        image: "/images/hero-background.svg",
        link: "/offers",
        cta: {
          text: locale === "ar" ? "استكشف العروض" : "Explore offers",
          link: "/offers",
        },
        badge: locale === "ar" ? "خيار العملاء" : "Top pick",
      },
    ],
    [locale]
  );

  const rawSlides = useMemo(() => {
    if (Array.isArray(slidesProp) && slidesProp.length) return slidesProp;
    if (heroAds.length) return heroAds;
    if (homepageBanners.length) return homepageBanners;
    return defaultSlides;
  }, [slidesProp, heroAds, homepageBanners, defaultSlides]);

  const normalizeField = useCallback(
    (slide, field, fallback = "") => {
      if (!slide) return fallback;
      const direct = slide[field];
      if (direct) {
        if (typeof direct === "string") return direct;
        if (typeof direct === "object") return pickLocaleValue(direct);
      }
      const lower = field.toLowerCase();
      if (locale === "ar") {
        if (slide[`${lower}_ar`]) return slide[`${lower}_ar`];
        if (slide[`ar_${lower}`]) return slide[`ar_${lower}`];
      }
      if (locale === "en") {
        if (slide[`${lower}_en`]) return slide[`${lower}_en`];
        if (slide[`en_${lower}`]) return slide[`en_${lower}`];
      }
      const fallbackKey = locale === "ar" ? `${lower}_en` : `${lower}_ar`;
      if (slide[fallbackKey]) return slide[fallbackKey];
      const camel = field.charAt(0).toUpperCase() + field.slice(1);
      if (slide[camel]) {
        if (typeof slide[camel] === "string") return slide[camel];
        if (typeof slide[camel] === "object")
          return pickLocaleValue(slide[camel]);
      }
      return fallback;
    },
    [locale, pickLocaleValue]
  );

  const [firstProductSlide, setFirstProductSlide] = useState(null);

  useEffect(() => {
    if (
      (Array.isArray(slidesProp) && slidesProp.length) ||
      heroAds.length ||
      homepageBanners.length
    )
      return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/products?page=1&pageSize=1");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const item = Array.isArray(data)
          ? data[0]
          : Array.isArray(data?.items)
          ? data.items[0]
          : null;
        if (!item || cancelled) return;
        const productSlide = {
          id: `product-${item.id || item.slug || "latest"}`,
          title: normalizeField(
            item,
            "name",
            locale === "ar" ? "منتج جديد" : "New arrival"
          ),
          subtitle: normalizeField(
            item,
            "short",
            locale === "ar"
              ? "اكتشف أحدث الإضافات إلى متجرنا"
              : "Discover the latest addition to our store"
          ),
          image:
            item.image ||
            item.imageUrl ||
            item.image_link ||
            item?.imageVariants?.original ||
            "/images/hero-background.svg",
          link: `/product/${item?.id || item?.slug || ""}`,
          cta: {
            text: locale === "ar" ? "عرض المنتج" : "View product",
            link: `/product/${item?.id || item?.slug || ""}`,
          },
          badge: locale === "ar" ? "أُضيف حديثًا" : "Just in",
        };
        setFirstProductSlide(productSlide);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    slidesProp,
    heroAds.length,
    homepageBanners.length,
    locale,
    normalizeField,
  ]);

  const normalizedSlides = useMemo(() => {
    const baseSlides = Array.isArray(rawSlides) ? rawSlides : [];
    const merged = firstProductSlide
      ? [firstProductSlide, ...baseSlides]
      : baseSlides;
    if (!merged.length) return defaultSlides;
    return merged.map((slide, index) => {
      const image =
        slide.imageUrl ||
        slide.image ||
        slide.media ||
        slide.coverImage ||
        slide.bannerUrl ||
        slide.imageVariants?.large ||
        slide.imageVariants?.medium ||
        heroBackgroundImage ||
        "/images/hero-background.svg";
      const link =
        slide.link ||
        slide.linkUrl ||
        slide.href ||
        slide.url ||
        slide.cta?.link ||
        "#";
      const ctaLink = slide.cta?.link || link;
      const ctaText = slide.cta?.text || normalizeField(slide, "ctaText", "");
      const resolvedTitle = normalizeField(
        slide,
        "title",
        locale === "ar" ? "عرض مميز" : "Featured offer"
      );
      const resolvedSubtitle = normalizeField(
        slide,
        "subtitle",
        normalizeField(slide, "description", "")
      );
      const badge = normalizeField(
        slide,
        "badge",
        slide.badgeText || slide.tagline || ""
      );
      return {
        id: slide.id || slide._id || `slide-${index}`,
        title: resolvedTitle,
        subtitle: resolvedSubtitle,
        image,
        link,
        badge,
        cta: ctaLink
          ? {
              text:
                ctaText || (locale === "ar" ? "اكتشف الآن" : "Discover now"),
              link: ctaLink,
            }
          : null,
      };
    });
  }, [rawSlides, firstProductSlide, normalizeField, locale, defaultSlides]);

  const defaultHighlights = useMemo(
    () => [
      {
        id: "highlight-delivery",
        title:
          locale === "ar" ? "توصيل خلال 48 ساعة" : "48h delivery nationwide",
        description:
          locale === "ar"
            ? "نوفّر تغطية كاملة للمملكة"
            : "Covering the entire kingdom",
        icon: "truck",
      },
      {
        id: "highlight-returns",
        title:
          locale === "ar" ? "إرجاع مجاني خلال 14 يومًا" : "Free 14 day returns",
        description:
          locale === "ar"
            ? "استرجع مشترياتك بسهولة"
            : "Return items without hassle",
        icon: "shield",
      },
      {
        id: "highlight-support",
        title: locale === "ar" ? "دعم مباشر 24/7" : "Live support 24/7",
        description:
          locale === "ar"
            ? "فريق مختص للرد على استفساراتك"
            : "Specialists ready to help",
        icon: "headset",
      },
    ],
    [locale]
  );

  const marketingHighlights = useMemo(() => {
    if (Array.isArray(marketing?.features) && marketing.features.length) {
      return marketing.features.slice(0, 4).map((feature, index) => ({
        id: feature.id || `feature-${index}`,
        title: pickLocaleValue(feature.title),
        description: pickLocaleValue(feature.body),
        icon: feature.icon,
      }));
    }
    return defaultHighlights;
  }, [marketing?.features, pickLocaleValue, defaultHighlights]);

  const finalHighlights = useMemo(() => {
    if (Array.isArray(highlightProp) && highlightProp.length) {
      return highlightProp;
    }
    return marketingHighlights;
  }, [highlightProp, marketingHighlights]);

  const storeName =
    locale === "ar"
      ? setting?.siteNameAr ||
        setting?.siteName ||
        setting?.siteNameEn ||
        "متجرك المفضل"
      : setting?.siteNameEn ||
        setting?.siteName ||
        setting?.siteNameAr ||
        "Your favourite store";

  const storeTagline =
    locale === "ar"
      ? setting?.taglineAr ||
        setting?.tagline ||
        "منتجات مختارة بعناية وشحن سريع"
      : setting?.taglineEn ||
        setting?.tagline ||
        "Curated products with express delivery";

  const storeLogo =
    setting?.logoUrl || setting?.logo || "/images/site-logo.svg";

  useHeroSwiper({
    selector: `#${sliderDomId}`,
    paginationSelector: showIndicators
      ? `#${sliderDomId} .swiper-pagination`
      : null,
    autoplayDelay:
      autoplayDelay && normalizedSlides.length > 1 ? autoplayDelay : 0,
    enabled: normalizedSlides.length > 1,
    showPagination: showIndicators && normalizedSlides.length > 1,
  });

  const heroAriaLabel =
    locale === "ar" ? "عروض الصفحة الرئيسية" : "Homepage featured promotions";

  const handleSlideNavigate = useCallback(
    (event, link) => {
      event?.preventDefault?.();
      navigateToLink(navigate, link);
    },
    [navigate]
  );

  const heroStyle = isElegant
    ? {
        "--hero-gradient": combinedBackground,
        "--hero-accent": accent,
        "--main_color": accent,
        backgroundSize: heroBackgroundImage ? "auto, cover" : undefined,
        backgroundPosition: heroBackgroundImage ? "center, center" : undefined,
        backgroundRepeat: heroBackgroundImage ? "no-repeat, no-repeat" : undefined,
      }
    : {
        "--main_color": accent,
        backgroundImage: heroBackgroundImage ? combinedBackground : undefined,
        backgroundSize: heroBackgroundImage ? "auto, cover" : undefined,
        backgroundPosition: heroBackgroundImage ? "center, center" : undefined,
        backgroundRepeat: heroBackgroundImage ? "no-repeat, no-repeat" : undefined,
      };

  const renderElegantHero = () => (
    <section
      className={clsx("hero-unified", "hero-unified--elegant", className)}
      style={heroStyle}
      role="region"
      aria-label={heroAriaLabel}
    >
      <div className="hero-elegant__blur" aria-hidden="true" />
      <div className="hero-elegant__inner">
        <div className="hero-elegant__visual">
          <div id={sliderDomId} className="slide-swp hero-elegant__swiper">
            <div className="swiper-wrapper">
              {normalizedSlides.map((slide, index) => {
                const primaryLink = slide.cta?.link || slide.link;
                return (
                  <div
                    className="swiper-slide hero-elegant__slide"
                    key={slide.id || index}
                  >
                    <motion.article
                      className="hero-elegant__card"
                      aria-label={slide.title || heroAriaLabel}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: false, amount: 0.65 }}
                      variants={heroCardVariants}
                    >
                      <button
                        type="button"
                        className="hero-elegant__card-hitarea"
                        onClick={(event) =>
                          handleSlideNavigate(event, primaryLink)
                        }
                        aria-label={slide.title || heroAriaLabel}
                      >
                        <span className="sr-only">
                          {slide.title || heroAriaLabel}
                        </span>
                      </button>
                      <motion.div
                        className="hero-elegant__media"
                        aria-hidden="true"
                        variants={heroMediaVariants}
                      >
                        <SafeImage
                          src={slide.image}
                          alt={slide.title || heroAriaLabel}
                          className="hero-elegant__image"
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "low"}
                        />
                      </motion.div>
                      <motion.div
                        className="hero-elegant__overlay"
                        variants={heroOverlayVariants}
                      >
                        {slide.badge ? (
                          <motion.span
                            className="hero-elegant__badge"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.badge}
                          </motion.span>
                        ) : null}
                        <motion.h2
                          className="hero-elegant__title"
                          variants={heroOverlayItemVariants}
                        >
                          {slide.title}
                        </motion.h2>
                        {slide.subtitle ? (
                          <motion.p
                            className="hero-elegant__subtitle"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.subtitle}
                          </motion.p>
                        ) : null}
                        <motion.div
                          className="hero-elegant__actions"
                          variants={heroActionsVariants}
                        >
                          {slide.cta ? (
                            <motion.button
                              type="button"
                              className="hero-elegant__cta"
                              onClick={(event) =>
                                handleSlideNavigate(event, slide.cta?.link)
                              }
                              variants={heroOverlayItemVariants}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {slide.cta.text}
                            </motion.button>
                          ) : null}
                          {slide.link &&
                          (!slide.cta || slide.cta.link !== slide.link) ? (
                            <motion.button
                              type="button"
                              className="hero-elegant__ghost"
                              onClick={(event) =>
                                handleSlideNavigate(event, slide.link)
                              }
                              variants={heroOverlayItemVariants}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {locale === "ar" ? "التفاصيل" : "Details"}
                            </motion.button>
                          ) : null}
                        </motion.div>
                      </motion.div>
                    </motion.article>
                  </div>
                );
              })}
            </div>
            {showIndicators && normalizedSlides.length > 1 ? (
              <div className="swiper-pagination hero-elegant__pagination" />
            ) : null}
          </div>
        </div>

        <aside className="hero-elegant__aside">
          <div className="hero-elegant__brand-card">
            <div className="hero-elegant__brand-logo">
              <SafeImage
                src={storeLogo}
                alt={storeName}
                loading="eager"
                className="hero-elegant__brand-image"
                fetchPriority="high"
              />
            </div>
            <div className="hero-elegant__brand-meta">
              <span className="hero-elegant__brand-badge">
                {locale === "ar" ? "تجربة متكاملة" : "Seamless experience"}
              </span>
              <h3 className="hero-elegant__brand-title">{storeName}</h3>
              <p className="hero-elegant__brand-copy">{storeTagline}</p>
            </div>
            <div className="hero-elegant__brand-actions">
              <button
                type="button"
                className="hero-elegant__brand-cta"
                onClick={(event) => handleSlideNavigate(event, "/products")}
              >
                {locale === "ar" ? "ابدأ التسوق" : "Shop now"}
              </button>
              <button
                type="button"
                className="hero-elegant__brand-ghost"
                onClick={(event) => handleSlideNavigate(event, "/offers")}
              >
                {locale === "ar" ? "آخر العروض" : "Latest offers"}
              </button>
            </div>
          </div>
          <div className="hero-elegant__meta">
            <p className="hero-elegant__meta-headline">
              {locale === "ar"
                ? "مجموعات مختارة بعناية"
                : "Meticulously curated collections"}
            </p>
            <p className="hero-elegant__meta-sub">
              {locale === "ar"
                ? "نمنحك مزيجًا من العلامات الراقية والمنتجات اليومية بلمسة فاخرة."
                : "A blend of coveted brands and everyday staples presented with a premium touch."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );

  const renderClassicHero = () => (
    <section
      className={clsx("slider", "hero-unified--classic", className)}
      style={heroStyle}
      role="region"
      aria-label={heroAriaLabel}
    >
      <div className="container">
        <div id={sliderDomId} className="slide-swp">
          <div className="swiper-wrapper">
            {normalizedSlides.map((slide, index) => (
              <div key={slide.id || index} className="swiper-slide">
                <motion.a
                  href={slide.cta?.link || slide.link || "#"}
                  onClick={(event) =>
                    handleSlideNavigate(event, slide.cta?.link || slide.link)
                  }
                  aria-label={slide.title || heroAriaLabel}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: false, amount: 0.7 }}
                  variants={classicSlideVariants}
                >
                  <motion.div
                    className="ad-image-container"
                    variants={heroMediaVariants}
                  >
                    <SafeImage
                      src={slide.image}
                      alt={slide.title || heroAriaLabel}
                      className="ad-image"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "low"}
                    />
                  </motion.div>
                  {(slide.title || slide.subtitle || slide.cta) && (
                    <motion.div
                      className="hero-overlay"
                      variants={classicOverlayVariants}
                    >
                      <motion.div
                        className="hero-overlay__content"
                        variants={heroOverlayVariants}
                      >
                        {slide.badge ? (
                          <motion.span
                            className="hero-elegant__badge hero-elegant__badge--legacy"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.badge}
                          </motion.span>
                        ) : null}
                        {slide.title ? (
                          <motion.h2
                            className="home-hero__title"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.title}
                          </motion.h2>
                        ) : null}
                        {slide.subtitle ? (
                          <motion.p
                            className="home-hero__lead"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.subtitle}
                          </motion.p>
                        ) : null}
                        {slide.cta ? (
                          <motion.span
                            className="hero-cta btn"
                            variants={heroOverlayItemVariants}
                          >
                            {slide.cta.text}
                          </motion.span>
                        ) : null}
                      </motion.div>
                    </motion.div>
                  )}
                </motion.a>
              </div>
            ))}
          </div>
          {showIndicators && normalizedSlides.length > 1 ? (
            <div
              className="swiper-pagination"
              aria-live="polite"
              aria-atomic="true"
            />
          ) : null}
        </div>

        <div className="banner_2">
          <div className="store-brand" role="presentation">
            <div className="brand-logo">
              <SafeImage
                src={storeLogo}
                alt={storeName}
                className="logo-image"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="brand-name">
              <h2 className="store-name">{storeName}</h2>
              <p className="store-tagline">{storeTagline}</p>
            </div>
            <button
              type="button"
              className="shop-now-btn btn justify-center"
              onClick={(event) => handleSlideNavigate(event, "/products")}
            >
              {locale === "ar" ? "تسوّق الآن" : "Shop now"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {isElegant ? renderElegantHero() : renderClassicHero()}
      <HomeHighlightBar items={finalHighlights} loading={marketing?.loading} />
    </>
  );
}
