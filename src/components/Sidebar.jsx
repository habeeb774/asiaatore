import React, { useState, useEffect, useMemo } from 'react';
import { useMarketing } from '../context/MarketingContext';
import { useLocation } from 'react-router-dom';

// A simplified, accessible React sidebar converted from the provided HTML.
// This keeps the structure and important links while avoiding raw HTML injection.
const menuItems = [
  { id: 'products-local', title: 'المنتجات', href: '/products', internal: true },
  { id: 'blog', title: 'المدونة', href: 'https://jomlah.app/ar/blog' },
  { id: 'offers', title: 'تخفيضات', href: 'https://jomlah.app/ar/offers' },
  { id: '695757483', title: 'العروض', href: 'https://jomlah.app/ar/category/RPYBqw' },
  { id: '700417380', title: 'مستلزمات البيت والمطبخ', href: 'https://jomlah.app/ar/category/wdnamB' },
  { id: '1638909706', title: 'التمور', href: 'https://jomlah.app/ar/category/evdgdp' },
  { id: '1608484491', title: 'الأكثر مبيعا', href: 'https://jomlah.app/ar/category/pAQRWz' },
  { id: '1716468104', title: 'المعلبات', href: 'https://jomlah.app/ar/category/Yzgmwl' },
  { id: '1866991334', title: 'الصلصات والصوصات', href: 'https://jomlah.app/ar/category/wAdnaR' },
  { id: '2072102037', title: 'الأرز والمكرونات', href: 'https://jomlah.app/ar/category/jgZvnB' },
  { id: '233924490', title: 'مشتقات الألبان', href: 'https://jomlah.app/ar/category/lvGanx' },
]

// خريطة أيقونات لكل عنصر (يمكنك تعديلها لاحقاً)
const itemIcons = {
  'products-local': '🛍️',
  blog: '📰',
  offers: '💸',
  '695757483': '🏷️',
  '700417380': '🍽️',
  '1638909706': '🌴',
  '1608484491': '🔥',
  '1716468104': '🥫',
  '1866991334': '🥫',
  '2072102037': '🍚',
  '233924490': '🧀'
};

export default function Sidebar(props) {
  // آمن للـ SSR
  const safeGet = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };

  const location = useLocation();

  // تهيئة: طي افتراضي على الشاشات الصغيرة
  const [collapsed, setCollapsed] = useState(() => {
    const saved = safeGet('sidebar_collapsed') === '1';
    if (saved) return true;
    if (typeof window !== 'undefined' && window.innerWidth < 992) return true;
    return false;
  });
  const [openGroups, setOpenGroups] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  // جديد: حالة إظهار / إخفاء القائمة الجانبية
  const [shown, setShown] = useState(false);

  // تحديد الرابط النشط
  const currentPath = location.pathname;
  const normalizeHref = (href) => {
    try {
      const u = new URL(href);
      return u.pathname;
    } catch {
      return href;
    }
  };

  const isActive = (href) => {
    const path = normalizeHref(href);
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  // مراقبة حجم الشاشة
  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth < 992;
      if (!isMobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // إغلاق عند تغيير المسار على الجوال
  useEffect(() => {
    if (window.innerWidth < 992) setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('with-sidebar-collapsed', collapsed);
    // عند الطي اغلق كل المجموعات المفتوحة
    if (collapsed && Object.keys(openGroups).length) {
      setOpenGroups({});
    }
  }, [collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // عند تغيير المسار على الشاشات الصغيرة أغلق القوائم
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setOpenGroups({});
      // يمكن مستقبلا غلق الشريط نفسه: setCollapsed(true);
    }
  }, [currentPath]);

  // عند الإخفاء نحذف كلاس الجسم السابق
  useEffect(() => {
    if (!shown) {
      document.body.classList.remove('with-sidebar-collapsed');
    }
  }, [shown]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar_collapsed', next ? '1' : '0'); } catch {}
  };

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* استبدال الزر السابق بزر أيقونة شفاف */}
      <button
        type="button"
        className="sidebar-main-toggle icon"
        aria-pressed={shown}
        aria-expanded={shown}
        aria-controls="app-sidebar"
        onClick={() => setShown(v => !v)}
        aria-label={shown ? 'إغلاق  ' : 'فتح  '}
      >
        {shown ? (
          /* أيقونة إغلاق (X) */
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true">
            <path d="M18 6 6 18"></path>
            <path d="M6 6 18 18"></path>
          </svg>
        ) : (
          /* أيقونة قائمة (Menu) */
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="lucide lucide-menu" aria-hidden="true">
            <path d="M4 5h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 19h16"></path>
          </svg>
        )}
      </button>

      {shown && (
        <aside
          id="app-sidebar"
          className={`sidebar${collapsed ? ' collapsed' : ''}`}
          data-collapsed={collapsed ? '1' : '0'}
          aria-label="التنقل الجانبي"
        >
          <div className="sidebar-inner">
            <div className="sidebar-head">
              {/* زر إغلاق كامل */}
              <button
                type="button"
                className="sidebar-toggle"
               onClick={() => setShown(v => !v)}

                aria-label="إغلاق القائمة"
              >
                ×
              </button>
            </div>

            {/* Top slider placeholder (original had a slider web-component) */}
            <div className="mobile-menu-slider mb-4">
              <div className="slider-placeholder" style={{height: 64, borderRadius: 8, background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))'}}>
                {/* lightweight placeholder to avoid custom webcomponents */}
              </div>
            </div>
            <SidebarMarketingBlock collapsed={collapsed} />

            <nav aria-label="القائمة الرئيسية">
              <ul className="main-menu hide-scroll" role="list">
                {menuItems.map(it => {
                  const active = isActive(it.href);
                    return (
                      <li
                        key={it.id}
                        className={`text-sm font-bold md:text-lg${active ? ' is-active' : ''}`}
                        role="none"
                      >
                        {it.internal ? (
                          <a
                            href={it.href}
                            className="sidemenu-link with-label"
                            aria-label={it.title}
                            aria-current={active ? 'page' : undefined}
                            role="menuitem"
                            title={collapsed ? it.title : undefined}
                          >
                            <span className="menu-icon" aria-hidden>{itemIcons[it.id] || '•'}</span>
                            <span className="menu-label">{it.title}</span>
                          </a>
                        ) : (
                          <a
                            href={it.href}
                            target="_self"
                            rel="noreferrer"
                            className="sidemenu-link with-label"
                            aria-label={it.title}
                            aria-current={active ? 'page' : undefined}
                            role="menuitem"
                            title={collapsed ? it.title : undefined}
                          >
                            <span className="menu-icon" aria-hidden>{itemIcons[it.id] || '•'}</span>
                            <span className="menu-label">{it.title}</span>
                          </a>
                        )}
                      </li>
                    );
                })}

                {/* Example of a collapsible group (converted from nested lists) */}
                <li className="text-sm font-bold md:text-lg has-group" role="none">
                  <button
                    type="button"
                    onClick={() => toggleGroup('sugar-tea')}
                    className={`group-toggle ${openGroups['sugar-tea'] ? 'open' : ''}`}
                    aria-expanded={!!openGroups['sugar-tea']}
                    aria-controls="group-sugar-tea"
                    title={collapsed ? 'السكر والشاي والقهوة' : undefined}
                  >
                    <span className="menu-icon" aria-hidden>☕</span>
                    <span className="menu_title">السكر والشاي والقهوة</span>
                    <span className="group-chevron" aria-hidden />
                  </button>
                  <ul
                    id="group-sugar-tea"
                    className={`group-list ${openGroups['sugar-tea'] ? 'open' : ''}`}
                    role="group"
                    aria-label="السكر والشاي والقهوة"
                  >
                    <li><a href="https://jomlah.app/ar/category/evjlny"><span className="submenu-bullet">•</span><span className="submenu-text">القهوة</span></a></li>
                    <li><a href="https://jomlah.app/ar/category/XPVdab"><span className="submenu-bullet">•</span><span className="submenu-text">الشاي</span></a></li>
                  </ul>
                </li>

                {/* Links section (روابط تهمك) */}
                <li className="links text-sm font-bold md:text-lg mt-4">
                  <span>
                    <i className="sicon-link me-2" aria-hidden />
                    روابط تهمك
                  </span>
                  <ul className="links-menu">
                    <li><a href="https://jomlah.app/ar/blog">المدونة</a></li>
                    <li><a href="https://jomlah.app/ar/p/XeEmn">مواقع التواصل الاجتماعي</a></li>
                    <li><a href="https://jomlah.app/ar/p/QdAGY">سياسة الإستبدال والإسترجاع</a></li>
                    <li><a href="https://jomlah.app/ar/p/XEDrd">سياسة الاستخدام والخصوصية</a></li>
                  </ul>
                </li>

                {/* Customer service & social */}
                <li className="social text-sm md:text-lg font-bold mt-4">
                  <span>
                    <i className="sicon-headphones me-2" aria-hidden />
                    خدمة العملاء
                  </span>
                  <div className="social-menu mt-2">
                    <h3 className="title text-center">خدمة العملاء</h3>
                    <div className="contact-links flex-center gap-3">
                      <a href="https://jomlah.app/ar/whatsapp/send" className="contact-link">واتساب</a>
                      <a href="tel:+966533170055" className="contact-link">جوال</a>
                      <a href="tel:+96653317005" className="contact-link">هاتف</a>
                      <a href="mailto:aalmeniei.firm@gmail.com" className="contact-link">ايميل</a>
                    </div>

                    <div className="social-links flex justify-center gap-2 mt-3">
                      <a href="http://instgram.com/jomlah_app" target="_blank" rel="noreferrer">انستقرام</a>
                      <a href="https://twitter.com/jomlah_app" target="_blank" rel="noreferrer">إكس</a>
                      <a href="https://snapchat.com/t/0P22QL4X" target="_blank" rel="noreferrer">سناب شات</a>
                      <a href="https://www.tiktok.com/@jomlah.app" target="_blank" rel="noreferrer">تيك توك</a>
                    </div>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </aside>
      )}
    </>
  )
}

// --- Marketing Block (Features + Banner Teaser) ---
const SidebarMarketingBlock = ({ collapsed }) => {
  const marketing = useMarketing();
  const features = marketing?.features || [];
  const homepageBanners = marketing?.byLocation?.homepage || [];
  const top3 = features.slice(0,3);
  if (!features.length && !homepageBanners.length) return null;
  return (
    <div className="mb-5" aria-label="مقتطفات التسويق">
      {homepageBanners.length > 0 && (
        <div className="mb-4 relative group" style={{borderRadius:12, overflow:'hidden'}}>
          <img src={homepageBanners[0].image} alt={homepageBanners[0].title?.ar || homepageBanners[0].title?.en || ''} className="w-full h-28 object-cover" loading="lazy" />
          {(homepageBanners[0].title?.ar || homepageBanners[0].title?.en) && (
            <div className="absolute inset-0 bg-black/50 flex items-end p-2">
              <p className="text-white text-[11px] leading-snug line-clamp-2">
                {homepageBanners[0].title?.ar || homepageBanners[0].title?.en}
              </p>
            </div>
          )}
        </div>
      )}
      {top3.length > 0 && (
        <ul className="space-y-2" style={{listStyle:'none',padding:0,margin:0}}>
          {top3.map(f => (
            <li key={f.id} className="flex items-start gap-2 text-[11px] bg-white/70 rounded-lg p-2 border border-gray-100 shadow-sm">
              <span className="text-lg" aria-hidden>{f.icon || '★'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{f.title?.ar || f.title?.en}</p>
                {f.body?.ar || f.body?.en ? <p className="text-gray-600 line-clamp-2 leading-snug text-[10px]">{f.body?.ar || f.body?.en}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
  

