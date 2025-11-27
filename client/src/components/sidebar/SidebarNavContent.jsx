import React, { useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "../ui";
import {
  Home,
  BookOpen,
  Package,
  BadgePercent,
  Store,
  ShoppingCart,
  ClipboardList,
  Users,
  Settings,
  X,
  MessageCircle,
  LogOut,
  LayoutDashboard,
  Heart,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionLink = motion(Link);

const BASE_CORE_NAV = [
  { to: "/", labelAr: "الرئيسية", labelEn: "Home", navKey: "home", icon: Home },
  {
    to: "/products",
    labelAr: "المنتجات",
    labelEn: "Products",
    navKey: "products",
    icon: Package,
  },
  {
    to: "/catalog",
    labelAr: "الكتالوج",
    labelEn: "Catalog",
    navKey: "catalog",
    icon: BookOpen,
  },
  {
    to: "/offers",
    labelAr: "العروض",
    labelEn: "Offers",
    navKey: "offers",
    icon: BadgePercent,
  },
  {
    to: "/cart",
    labelAr: "السلة",
    labelEn: "Cart",
    navKey: "cart",
    icon: ShoppingCart,
  },
  {
    to: "/wishlist",
    labelAr: "المفضلة",
    labelEn: "Favorites",
    navKey: "wishlist",
    icon: Heart,
  },
];

const NavLinkItem = React.memo(function NavLinkItem({
  item,
  pathname,
  locale,
  collapsed,
  mobileMode,
  closeMobile,
  t,
  badges = {},
  index = 0,
}) {
  const candidates = [item.to, `/en${item.to}`, `/fr${item.to}`];
  const active = candidates.some(
    (c) => pathname === c || pathname.startsWith(`${c}/`)
  );

  let text;
  try {
    const key = item.navKey ? `nav.${item.navKey}` : null;
    if (key) {
      const val = t(key);
      if (val && val !== key) text = val;
    }
  } catch {}
  if (!text) text = locale === "ar" ? item.labelAr : item.labelEn;

  const Icon = item.icon;
  const badgeCount = badges[item.navKey] || 0;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const [open, setOpen] = React.useState(() => {
    try {
      return (
        hasChildren &&
        item.children.some(
          (c) =>
            pathname && (pathname === c.to || pathname.startsWith(`${c.to}/`))
        )
      );
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (hasChildren) {
      const shouldOpen = item.children.some(
        (c) =>
          pathname && (pathname === c.to || pathname.startsWith(`${c.to}/`))
      );
      if (shouldOpen !== open) setOpen(shouldOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleOpen = React.useCallback((event) => {
    event && event.preventDefault();
    setOpen((value) => !value);
  }, []);

  const navMain = (
    <Link
      to={item.to}
      className="nav-link"
      data-active={active}
      aria-current={active ? "page" : undefined}
      title={collapsed ? text : undefined}
      data-tip={collapsed ? text : undefined}
      onClick={(event) => {
        if (hasChildren) {
          event.preventDefault();
          toggleOpen(event);
        } else if (mobileMode) {
          closeMobile();
        }
      }}
      role="menuitem"
      tabIndex={0}
      aria-haspopup={hasChildren ? "true" : undefined}
      aria-expanded={hasChildren ? !!open : undefined}
    >
      <span className="nav-icon" aria-hidden="true">
        {typeof Icon === "string" ? (
          <span style={{ fontSize: "1.4rem" }}>{Icon}</span>
        ) : Icon ? (
          <Icon size={20} />
        ) : null}
        {badgeCount > 0 && (
          <span className="nav-badge" aria-hidden="true">
            {Math.min(badgeCount, 99)}
          </span>
        )}
      </span>
      <span className="nav-label">{text}</span>
      {hasChildren && (
        <button
          aria-label={
            open
              ? locale === "ar"
                ? "إغلاق"
                : "Collapse"
              : locale === "ar"
              ? "فتح"
              : "Expand"
          }
          className={`nav-submenu-toggle ${open ? "open" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleOpen(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleOpen(event);
            }
          }}
          tabIndex={-1}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </Link>
  );

  return (
    <motion.li
      className="nav-item"
      role="none"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.25),
        ease: [0.23, 1, 0.32, 1],
      }}
      layout
    >
      <Tooltip
        content={text}
        placement={locale === "ar" ? "left" : "right"}
        disabled={!collapsed || mobileMode}
      >
        {navMain}
      </Tooltip>
      {hasChildren && (
        <ul
          className={`nav-submenu ${open ? "open" : ""}`}
          role="group"
          aria-label={text}
        >
          {item.children.map((child) => (
            <li key={child.to} className="nav-item" role="none">
              <Link
                to={child.to}
                className="nav-link"
                data-active={
                  pathname === child.to || pathname?.startsWith(`${child.to}/`)
                }
                role="menuitem"
                onClick={() => mobileMode && closeMobile()}
              >
                <span className="nav-icon" aria-hidden>
                  {child.icon ? (
                    typeof child.icon === "string" ? (
                      <span style={{ fontSize: 14 }}>{child.icon}</span>
                    ) : (
                      <child.icon size={18} />
                    )
                  ) : null}
                </span>
                <span className="nav-label">
                  {locale === "ar" ? child.labelAr : child.labelEn}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.li>
  );
});

const SidebarHeader = ({ setting, locale, t, closePanel }) => (
  <div className="sidebar-modern__head">
    <Link to="/" className="flex items-center gap-3" onClick={closePanel}>
      <img
        src={setting?.logoUrl || "/images/site-logo.svg"}
        alt={setting?.siteName || "Logo"}
        className="h-10 w-auto"
      />
      <span className="sidebar-modern__brand">
        {locale === "ar"
          ? setting?.siteNameAr || "متجري"
          : setting?.siteNameEn || "My Store"}
      </span>
    </Link>
    <button
      type="button"
      className="sidebar-modern__toggle lg:hidden"
      onClick={closePanel}
      aria-label={t("closeMenu") || "إغلاق القائمة"}
    >
      <X size={20} />
    </button>
  </div>
);

const SidebarFooter = ({ user, t, logout, closePanel, locale }) => {
  const loginLabel = t("login", {
    defaultValue: locale === "ar" ? "تسجيل الدخول" : "Login",
  });
  const loginTitle = t("sidebar.login.title", {
    defaultValue:
      locale === "ar"
        ? "سجّل الدخول لاستكشاف كل المزايا"
        : "Sign in to unlock every perk",
  });
  const loginSubtitle = t("sidebar.login.subtitle", {
    defaultValue:
      locale === "ar"
        ? "انضم الآن للتسوّق السلس وتتبع الطلبات"
        : "Join now for seamless shopping and tracking",
  });
  const DirectionIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  const arrowHoverClass =
    locale === "ar"
      ? "group-hover:-translate-x-1"
      : "group-hover:translate-x-1";

  const loginButton = (
    <MotionLink
      to="/login"
      onClick={closePanel}
      aria-label={loginLabel}
      className="sidebar-footer__login group"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="sidebar-footer__login-icon">
        <Users size={18} />
      </span>
      <span className="sidebar-footer__login-copy">
        <span className="sidebar-footer__login-title">{loginTitle}</span>
        <span className="sidebar-footer__login-subtitle">{loginSubtitle}</span>
      </span>
      <span className={`sidebar-footer__login-arrow ${arrowHoverClass}`} aria-hidden>
        <DirectionIcon size={16} />
      </span>
    </MotionLink>
  );

  return (
    <div
      className="sidebar-modern__footer"
      data-expanded="false"
    >
      <div className="footer-compact">
        {!user ? (
          loginButton
        ) : (
          <div className="sidebar-footer__profile">
            <span className="sidebar-footer__avatar">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "avatar"}
                  className="sidebar-footer__avatar-img"
                />
              ) : (
                <Users size={18} />
              )}
            </span>
            <div className="sidebar-footer__profile-copy">
              <span className="sidebar-footer__profile-name">{user.name}</span>
              {user.email ? (
                <span className="sidebar-footer__profile-email">{user.email}</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                closePanel();
              }}
              aria-label={t("logout") || "تسجيل الخروج"}
              className="sidebar-footer__logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SidebarNavContent = ({
  locale,
  t,
  user,
  closePanel,
  collapsed,
  isMobile,
  search,
  setSearch,
  normalizedSearch,
  pathname,
  badges = {},
  setting,
  logout,
  whatsappHref,
}) => {
  const coreNav = useMemo(() => {
    const list = [...BASE_CORE_NAV];
    if (user) {
      list.push({
        to: "/my-orders",
        labelAr: "طلباتي",
        labelEn: "My Orders",
        navKey: "myOrders",
        icon: ClipboardList,
      });
      if (user.role === "admin") {
        list.push({
          to: "/admin/overview",
          labelAr: "لوحة التحكم",
          labelEn: "Dashboard",
          navKey: "adminDashboard",
          icon: LayoutDashboard,
        });
      }
      if (user.role === "seller" || user.role === "admin") {
        list.push({
          to: "/seller/kyc",
          labelAr: "توثيق البائع",
          labelEn: "Seller KYC",
          navKey: "sellerKyc",
          icon: Settings,
        });
      }
      if (user.role === "delivery") {
        list.push({
          to: "/delivery",
          labelAr: "التوصيل",
          labelEn: "Delivery",
          icon: ClipboardList,
        });
        list.push({
          to: "/delivery/map",
          labelAr: "خريطة التتبع",
          labelEn: "Delivery Map",
          icon: "🗺️",
        });
        list.push({
          to: "/delivery/history",
          labelAr: "سجل التوصيل",
          labelEn: "History",
          icon: "🕘",
        });
        list.push({
          to: "/delivery/availability",
          labelAr: "التوفر",
          labelEn: "Availability",
          icon: "✅",
        });
      }
    }
    return list;
  }, [user]);

  const heroGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const slot = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const emoji =
      slot === "morning" ? "🌅" : slot === "afternoon" ? "🌤️" : "🌙";

    if (locale === "ar") {
      const label =
        slot === "morning"
          ? "بداية رائقة"
          : slot === "afternoon"
          ? "إطلالة براقة"
          : "مساء هادئ";
      const message =
        slot === "morning"
          ? "ابدأ يومك باختيار فاخر."
          : slot === "afternoon"
          ? "تابع رحلتك مع مختارات أنيقة."
          : "استرخِ وتمتع بأمسية مترفة.";
      return { emoji, label, message };
    }

    const label =
      slot === "morning"
        ? "Morning glow"
        : slot === "afternoon"
        ? "Afternoon shine"
        : "Evening calm";
    const message =
      slot === "morning"
        ? "Start the day with something inspiring."
        : slot === "afternoon"
        ? "Keep your momentum with curated picks."
        : "Unwind with evening exclusives waiting for you.";
    return { emoji, label, message };
  }, [locale]);

  const searchShortcuts = useMemo(
    () =>
      locale === "ar"
        ? [
            { label: "وصل حديثاً", query: "new" },
            { label: "عروض حصرية", query: "exclusive" },
            { label: "لمسة فاخرة", query: "luxury" },
          ]
        : [
            { label: "New arrivals", query: "new" },
            { label: "Exclusive offers", query: "exclusive" },
            { label: "Luxury edit", query: "luxury" },
          ],
    [locale]
  );

  const accountLinks = useMemo(
    () => [
      {
        to: "/account/profile",
        labelAr: "ملفي الشخصي",
        labelEn: "My Profile",
        navKey: "profile",
        icon: Users,
      },
      {
        to: "/account/orders",
        labelAr: "طلباتي",
        labelEn: "My Orders",
        navKey: "orders",
        icon: ClipboardList,
      },
    ],
    []
  );

  const infoLinks = useMemo(
    () => [
      {
        to: "/about",
        labelAr: "عنا",
        labelEn: "About Us",
        navKey: "about",
        icon: Store,
      },
      {
        to: "/contact",
        labelAr: "اتصل بنا",
        labelEn: "Contact Us",
        navKey: "contact",
        icon: MessageCircle,
      },
    ],
    []
  );

  const filterItems = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      if (!normalizedSearch) return items;
      const query = normalizedSearch;
      return items.filter((item) => {
        const tokens = [item.labelAr, item.labelEn, item.navKey];
        const matchesSelf = tokens.some(
          (token) => token && token.toLowerCase().includes(query)
        );
        if (matchesSelf) return true;
        if (Array.isArray(item.children)) {
          return item.children.some((child) => {
            const childTokens = [child.labelAr, child.labelEn, child.navKey];
            return childTokens.some(
              (token) => token && token.toLowerCase().includes(query)
            );
          });
        }
        return false;
      });
    },
    [normalizedSearch]
  );

  const filteredCore = filterItems(coreNav);
  const filteredAccount = user ? filterItems(accountLinks) : [];
  const filteredInfo = filterItems(infoLinks);
  const hasResults =
    filteredCore.length + filteredAccount.length + filteredInfo.length > 0;

  let offset = 0;
  const renderSection = (items, sectionId) => {
    if (!items.length) return null;
    const content = (
      <AnimatePresence initial={false}>
        {items.map((item, idx) => (
          <NavLinkItem
            key={item.to}
            item={item}
            pathname={pathname}
            locale={locale}
            collapsed={collapsed}
            mobileMode={isMobile}
            closeMobile={closePanel}
            t={t}
            badges={badges}
            index={offset + idx}
          />
        ))}
      </AnimatePresence>
    );
    offset += items.length;
    return (
      <ul className="space-y-1" role="menu" aria-labelledby={sectionId}>
        {content}
      </ul>
    );
  };

  const rtl = locale === "ar";
  const iconPosition = rtl ? "right-4" : "left-4";
  const inputPadding = rtl ? "pr-11 pl-4 text-right" : "pl-11 pr-4";

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <SidebarHeader
        setting={setting}
        locale={locale}
        t={t}
        closePanel={closePanel}
      />

      <nav className="flex-1 overflow-y-auto px-5 pb-6 pt-5 space-y-6">
        <div className="relative overflow-hidden rounded-[26px] border border-emerald-100/70 bg-gradient-to-br from-emerald-50/85 via-white to-sky-50/75 p-6 text-slate-900 shadow-[0_24px_48px_-32px_rgba(16,38,73,0.55)]">
          <div
            className="pointer-events-none absolute -left-16 -top-10 h-40 w-40 rounded-full bg-emerald-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-12 bottom-[-24px] h-36 w-36 rounded-full bg-sky-200/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_65%)]"
            aria-hidden
          />
          <div className="relative z-10 space-y-5">
            <div
              className={`flex items-center justify-between gap-3 ${rtl ? "flex-row-reverse text-right" : ""}`}
            >
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-emerald-100/80 bg-white/80 px-3 py-1.5 text-emerald-700 shadow-sm backdrop-blur ${rtl ? "flex-row-reverse" : ""}`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <Sparkles size={14} />
                </span>
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em]">
                  {locale === "ar" ? "بحث ذكي" : "Smart search"}
                </span>
              </div>
              <div
                className={`hidden sm:flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-700/80 ${rtl ? "flex-row-reverse" : ""}`}
              >
                <span>{locale === "ar" ? "اختصار البحث" : "Quick search"}</span>
                <kbd className="rounded-md border border-emerald-200 bg-white/85 px-1.5 py-0.5 text-[0.6rem] shadow-sm">
                  Ctrl
                </kbd>
                <kbd className="rounded-md border border-emerald-200 bg-white/85 px-1.5 py-0.5 text-[0.6rem] shadow-sm">
                  K
                </kbd>
              </div>
            </div>

            <div className={`space-y-1 ${rtl ? "text-right" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700/70">
                {heroGreeting.label}
              </p>
              <p className="text-sm font-medium text-slate-900/90">
                {heroGreeting.emoji} {heroGreeting.message}
              </p>
            </div>

            <label htmlFor="sidebar-search" className="sr-only">
              {locale === "ar" ? "بحث في القائمة" : "Search navigation"}
            </label>
            <div className="relative">
              <Search
                size={18}
                className={`pointer-events-none absolute ${iconPosition} top-1/2 -translate-y-1/2 text-emerald-600`}
                aria-hidden
              />
              <input
                id="sidebar-search"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  locale === "ar"
                    ? "ابحث عن منتج، قسم أو أمر إداري..."
                    : "Search products, sections, or quick actions..."
                }
                className={`w-full rounded-2xl border border-emerald-100/80 bg-white/90 py-2.5 ${inputPadding} text-sm font-medium text-slate-900 shadow-[0_6px_22px_rgba(15,23,42,0.08)] outline-none transition placeholder:text-emerald-700/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50`}
              />
            </div>

            <div className={`flex flex-wrap gap-2 ${rtl ? "justify-end" : ""}`}>
              {searchShortcuts.map((shortcut) => (
                <button
                  key={shortcut.query}
                  type="button"
                  onClick={() => setSearch(shortcut.query)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/80"
                >
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-emerald-600">
                    #
                  </span>
                  {shortcut.label}
                </button>
              ))}
            </div>

            <div
              className={`flex items-center gap-2 rounded-2xl border border-emerald-100/60 bg-white/75 px-3 py-2 text-[0.7rem] text-emerald-700/90 shadow-sm ${rtl ? "flex-row-reverse text-right" : ""}`}
            >
              <Sparkles size={14} className="text-emerald-500" />
              <span>
                {locale === "ar"
                  ? "اكتب كلمة مثل \"العروض\" للانتقال السريع إلى القسم المطلوب."
                  : "Try a keyword like \"offers\" to jump straight to the section you need."}
              </span>
            </div>

            {normalizedSearch && !hasResults && (
              <p className="rounded-xl border border-amber-200/60 bg-amber-100/70 px-4 py-3 text-xs font-medium text-amber-700">
                {locale === "ar"
                  ? "لم يتم العثور على عناصر مطابقة في الوقت الحالي."
                  : "No matches yet—try another keyword or explore the shortcuts above."}
              </p>
            )}
          </div>
        </div>


        <div className="space-y-6">
          <div className="space-y-1">
            <h3
              className="nav-section-label"
              id="store-links-header"
            >
              {t("nav.store") || "المتجر"}
            </h3>
            {renderSection(filteredCore, "store-links-header")}
          </div>

          {user && filteredAccount.length > 0 && (
            <div className="space-y-1">
              <h3
                className="nav-section-label"
                id="account-links-header"
              >
                {t("nav.account") || "حسابي"}
              </h3>
              {renderSection(filteredAccount, "account-links-header")}
            </div>
          )}

          <div className="space-y-1">
            <h3
              className="nav-section-label"
              id="info-links-header"
            >
              {t("nav.information") || "المعلومات"}
            </h3>
            {renderSection(filteredInfo, "info-links-header")}
          </div>

          {whatsappHref && (
            <motion.a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-inner transition"
              style={{
                background: 'rgba(var(--color-accent-rgb, 172, 204, 230), 0.15)',
                borderColor: 'rgba(var(--color-accent-rgb, 172, 204, 230), 0.3)',
                color: 'var(--color-primary-alt, #1C75BC)',
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>
                {locale === "ar"
                  ? "تحدث مع مستشار المتجر"
                  : "Chat with concierge"}
              </span>
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white"
                style={{ background: 'var(--color-success, #22c55e)' }}
              >
                <MessageCircle size={16} />
              </span>
            </motion.a>
          )}
        </div>
      </nav>

      <SidebarFooter
        user={user}
        t={t}
        logout={logout}
        closePanel={closePanel}
        locale={locale}
      />
    </div>
  );
};

export default SidebarNavContent;
