import React from 'react';
import SidebarNav from './SidebarNav';
import HeaderNav from './HeaderNav';
import AnnouncementBar from './AnnouncementBar';
import CategoryScroller from './CategoryScroller';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from '../ui/ToastProvider';
import { useTheme } from '../../context/ThemeContext';
import SiteFooter from './SiteFooter';
import FloatingCart from '../ui/FloatingCart';
import { SidebarProvider } from '../../context/SidebarContext';
import BottomNav from './BottomNav';
import SearchOverlay from '../search/SearchOverlay';
import CartSidebar from '../cart/CartSidebar';
import { useCart } from '../../context/CartContext';

const AppLayout = ({ children }) => {
  // Listen for cart:open event to open cart panel from anywhere
  React.useEffect(() => {
    const handler = () => setPanel('cart');
    window.addEventListener('cart:open', handler);
    return () => window.removeEventListener('cart:open', handler);
  }, []);
  const { locale, setLocale, available } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/en';
  const [panel, setPanel] = React.useState(null);
  // Use ESM imports for cart context
  const { cartItems = [], updateQuantity } = useCart();
  const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0) : 0;
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="app-layout professional-layout theme-minimal">
          <SidebarNav />
          <div className="content-with-sidebar">
            <AnnouncementBar />
            <HeaderNav />
            {/* Avoid duplicating categories bar on Home. Home renders CategoryChips section itself. */}
            {!isHome && <CategoryScroller />}
            {/* Language & Theme selectors moved into HeaderNav */}
            {children}
            {/* Mobile spacer so content isn't hidden behind BottomNav */}
            <div className="h-16 md:h-0" />
            <SiteFooter />
          </div>
          <FloatingCart />
          <SearchOverlay />
          <BottomNav panel={panel} setPanel={setPanel} />
          {/* Render cart-panel if panel === 'cart' */}
          {panel === 'cart' && (
            <CartSidebar
              open={true}
              onClose={() => setPanel(null)}
              items={cartItems}
              total={cartTotal}
              locale={locale}
              t={typeof window !== 'undefined' && window.t ? window.t : (k => k)}
              updateQuantity={updateQuantity}
            />
          )}
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
};

export default AppLayout;
