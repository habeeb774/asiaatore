import React from 'react';
import SidebarNav from './SidebarNav';
import HeaderNav from './HeaderNav';
import AnnouncementBar from './AnnouncementBar';
import CategoryScroller from './CategoryScroller';
import Breadcrumbs from './BreadcrumbsProxy.jsx';
import { useLanguage } from '../../stores/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from '../ui/ToastProvider';
import { ToastContainer } from 'react-toastify';
import { useTheme } from '../../stores/ThemeContext';
import SiteFooter from './SiteFooter';
import { FloatingCart } from '../ui';
import { SidebarProvider } from '../../stores/SidebarContext';
import BottomNav from './BottomNav';
import SearchOverlay from '../search/SearchOverlay';
import CartSidebar from '../cart/CartSidebar';
import { useCart } from '../../stores/CartContext';
import PageLoader from '../common/PageLoader';
import AdminSetupModal from '../setup/AdminSetupModal.jsx';

// مكون التخطيط الرئيسي للتطبيق - يحتوي على الشريط الجانبي، الهيدر، والمحتوى الرئيسي
const AppLayout = ({ children }) => {
  const { locale } = useLanguage();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/ar';
  const [panel, setPanel] = React.useState(null); // حالة لإدارة اللوحات الجانبية مثل السلة
  const { cartItems = [], updateQuantity } = useCart();

  // السماح بفتح السلة من أي مكان في التطبيق
  const contentRef = React.useRef(null); // مرجع لعنصر المحتوى الرئيسي لإدارة الهوامش

  // إضافة اختصار لوحة المفاتيح "/" لفتح البحث
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      // فحص ما إذا كان المفتاح المضغوط هو "/"
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // التأكد من أننا لسنا داخل حقل إدخال
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox'
        );

        // إذا لم نكن في حقل إدخال، افتح البحث
        if (!isInputField) {
          event.preventDefault(); // منع السلوك الافتراضي للمتصفح
          try {
            window.dispatchEvent(new CustomEvent('search:focus'));
          } catch (error) {
            console.warn('Failed to trigger search focus:', error);
          }
        }
      }
    };

    // إضافة event listener
    document.addEventListener('keydown', handleKeyDown);

    // تنظيف عند إلغاء المكون
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // دفع المحتوى تلقائيًا عند توسعة الشريط الجانبي (desktop)
  React.useEffect(() => {
    if (typeof document === 'undefined' || !contentRef.current) return;
    const aside = document.getElementById('app-sidebar');
    if (!aside) return;

    // Capture the current element to avoid ref issues in cleanup
    const contentElement = contentRef.current;

    const applyPush = () => {
      try {
        // NOTE: Previously we skipped pushing content for the `home-inline-sidebar` layout
        // and let CSS handle it. To ensure the page is always shrunk to the sidebar width
        // (even on the homepage), we no longer early-return here. CSS still provides
        // sensible fallbacks, but JS will set precise inline margins for pixel-perfect layout.

        // only push on desktop widths
        if (window.innerWidth < 769) {
          contentElement.style.marginLeft = '';
          contentElement.style.marginRight = '';
          return;
        }

        const dir = document.documentElement?.getAttribute('dir') || 'ltr';
        // Previously we treated collapsed (mini) sidebar as an overlay and did not push the
        // content. Change: always reserve space equal to the sidebar width so the page
        // shrinks instead of being covered when the sidebar is collapsed.
        // (If hover-expansion occurs, the aside.offsetWidth will increase and we'll push more.)

        const width = aside.offsetWidth || 0;
        if (width > 0) {
          if (dir === 'rtl') {
            contentElement.style.marginRight = `${width}px`;
            contentElement.style.marginLeft = '';
          } else {
            contentElement.style.marginLeft = `${width}px`;
            contentElement.style.marginRight = '';
          }
        } else {
          contentElement.style.marginLeft = '';
          contentElement.style.marginRight = '';
        }
      } catch {
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
      if (contentElement) {
        contentElement.style.marginLeft = '';
        contentElement.style.marginRight = '';
      }
    };
  }, [contentRef]);
  React.useEffect(() => {
    const handler = () => setPanel('cart');
    window.addEventListener('cart:open', handler);
    return () => window.removeEventListener('cart:open', handler);
  }, []); // إضافة مستمع لحدث فتح السلة من أي مكان في التطبيق

  const cartTotal = Array.isArray(cartItems)
    ? cartItems.reduce(
        (s, i) =>
          s +
          (Number(i.price || i.salePrice || 0) * Number(i.quantity || 1)),
        0
      )
    : 0; // حساب إجمالي سعر السلة

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
          <SidebarNav /> {/* الشريط الجانبي للتنقل */}

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
            <AnnouncementBar /> {/* شريط الإعلانات */}
            <HeaderNav /> {/* الهيدر الرئيسي */}

            {/* ✅ عرض شريط الفئات فقط في غير الصفحة الرئيسية */}
            { <CategoryScroller />} {/* شريط تمرير الفئات */}

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
              } catch {
                return null;
              }
            })()} {/* شريط التنقل (Breadcrumbs) */}

            {/* ✅ المحتوى */}
            <main style={{ flex: 1 }}>{children}</main> {/* المحتوى الرئيسي للصفحة */}

            {/* ✅ مسافة لتجنب تغطية BottomNav */}
            <div className="h-16 md:h-0" /> {/* مسافة للتنقل السفلي على الهواتف */}

            <SiteFooter /> {/* تذييل الموقع */}
          </div>

          <FloatingCart /> {/* سلة التسوق العائمة */}
          <SearchOverlay /> {/* تراكب البحث */}
          <BottomNav panel={panel} setPanel={setPanel} /> {/* التنقل السفلي للهواتف */}

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
          )} {/* عرض السلة الجانبية عند فتحها */}
        </div>
      </SidebarProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      /> {/* حاوية الإشعارات (Toast) */}
    </ToastProvider>
  );
};

export default AppLayout;
