import React from 'react';
import SidebarNav from './SidebarNav';
import HeaderNav from './HeaderNav';
import AnnouncementBar from './AnnouncementBar';
import CategoryScroller from './CategoryScroller';
import Breadcrumbs from './BreadcrumbsProxy.jsx';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from '../ui/ToastProvider';
import { useTheme } from '../../context/ThemeContext';
import SiteFooter from './SiteFooter';
import { FloatingCart } from '../ui';
import { SidebarProvider } from '../../context/SidebarContext';
import BottomNav from './BottomNav';
import SearchOverlay from '../search/SearchOverlay';
import CartSidebar from '../cart/CartSidebar';
import { useCart } from '../../context/CartContext';
import PageLoader from '../common/PageLoader';
import AdminSetupModal from '../setup/AdminSetupModal.jsx';

const AppLayout = ({ children }) => {
  const { locale } = useLanguage();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/en';
  const [panel, setPanel] = React.useState(null);
  const { cartItems = [], updateQuantity } = useCart();

  // السماح بفتح السلة من أي مكان في التطبيق
  const contentRef = React.useRef(null);

  // دفع المحتوى تلقائيًا عند توسعة الشريط الجانبي (desktop)
  React.useEffect(() => {
    if (typeof document === 'undefined' || !contentRef.current) return;
    const aside = document.getElementById('app-sidebar');
    if (!aside) return;

    const applyPush = () => {
      try {
        // NOTE: Previously we skipped pushing content for the `home-inline-sidebar` layout
        // and let CSS handle it. To ensure the page is always shrunk to the sidebar width
        // (even on the homepage), we no longer early-return here. CSS still provides
        // sensible fallbacks, but JS will set precise inline margins for pixel-perfect layout.

        // only push on desktop widths
        if (window.innerWidth < 769) {
          contentRef.current.style.marginLeft = '';
          contentRef.current.style.marginRight = '';
          return;
        }

        const dir = document.documentElement?.getAttribute('dir') || 'ltr';
        const isCollapsed = String(aside.getAttribute('data-collapsed')) === 'true';
        const isHover = String(aside.getAttribute('data-hover')) === 'true';
        // Previously we treated collapsed (mini) sidebar as an overlay and did not push the
        // content. Change: always reserve space equal to the sidebar width so the page
        // shrinks instead of being covered when the sidebar is collapsed.
        // (If hover-expansion occurs, the aside.offsetWidth will increase and we'll push more.)

        const width = aside.offsetWidth || 0;
        if (width > 0) {
          if (dir === 'rtl') {
            contentRef.current.style.marginRight = `${width}px`;
            contentRef.current.style.marginLeft = '';
          } else {
            contentRef.current.style.marginLeft = `${width}px`;
            contentRef.current.style.marginRight = '';
          }
        } else {
          contentRef.current.style.marginLeft = '';
          contentRef.current.style.marginRight = '';
        }
      } catch (e) {
        // ignore
      }
    };

    applyPush();
    const mo = new MutationObserver(() => applyPush());
    mo.observe(aside, { attributes: true, attributeFilter: ['data-collapsed', 'data-hover', 'data-open', 'style', 'class'] });
    window.addEventListener('resize', applyPush);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', applyPush);
      if (contentRef.current) {
        contentRef.current.style.marginLeft = '';
        contentRef.current.style.marginRight = '';
      }
    };
  }, [contentRef]);
  React.useEffect(() => {
    const handler = () => setPanel('cart');
    window.addEventListener('cart:open', handler);
    return () => window.removeEventListener('cart:open', handler);
  }, []);

  const cartTotal = Array.isArray(cartItems)
    ? cartItems.reduce(
        (s, i) =>
          s +
          (Number(i.price || i.salePrice || 0) * Number(i.quantity || 1)),
        0
      )
    : 0;

  return (
    <ToastProvider>
      <SidebarProvider>
        <div
          className={`app-layout professional-layout theme-minimal ${
            isHome ? 'home-inline-sidebar' : ''
          }`}
          style={{
            minHeight: '100vh',
            overflowY: 'scroll', // ✅ السماح بالتمرير في كل الصفحات
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin', // لمتصفحات Firefox
          }}
        >
          <PageLoader />
          <AdminSetupModal />
          <SidebarNav />

          <div
            ref={contentRef}
            className="content-with-sidebar"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <AnnouncementBar />
            <HeaderNav />

            {/* ✅ عرض شريط الفئات فقط في غير الصفحة الرئيسية */}
            {!isHome && <CategoryScroller />}

            {/* Breadcrumbs: render a simple, computed breadcrumb for most pages.
               Skip homepage and product detail pages (product page has its own bespoke breadcrumb). */}
            {!isHome && !pathname.startsWith('/product') && (() => {
              try {
                const t = (typeof window !== 'undefined' && window.t) ? window.t : (k)=>k;
                const parts = pathname.split('/').filter(Boolean);
                const items = [{ label: t('breadcrumbHome') || 'Home', to: '/' }];
                // build intermediate path segments
                let acc = '';
                parts.forEach((p, idx) => {
                  acc += `/${p}`;
                  // last item: don't provide `to` (current page)
                  const label = decodeURIComponent(p).replace(/[-_]/g, ' ');
                  if (idx === parts.length - 1) items.push({ label });
                  else items.push({ label: label.charAt(0).toUpperCase() + label.slice(1), to: acc });
                });
                return (
                  <div className="container-custom px-4 py-3">
                    <Breadcrumbs items={items} />
                  </div>
                );
              } catch (e) {
                return null;
              }
            })()}

            {/* ✅ المحتوى */}
            <main style={{ flex: 1 }}>{children}</main>

            {/* ✅ مسافة لتجنب تغطية BottomNav */}
            <div className="h-16 md:h-0" />

            <SiteFooter />
          </div>

          <FloatingCart />
          <SearchOverlay />
          <BottomNav panel={panel} setPanel={setPanel} />

          {/* ✅ السلة الجانبية */}
          {panel === 'cart' && (
            <CartSidebar
              open={true}
              onClose={() => setPanel(null)}
              items={cartItems}
              total={cartTotal}
              locale={locale}
              t={
                typeof window !== 'undefined' && window.t
                  ? window.t
                  : (k) => k
              }
              updateQuantity={updateQuantity}
            />
          )}
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
};

export default AppLayout;
