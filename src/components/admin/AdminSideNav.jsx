import React from 'react';
import { useLocation } from 'react-router-dom';

const navWrap = {
  minWidth: 200,
  alignSelf: 'flex-start',
  position: 'sticky',
  top: 12,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '.5rem',
  boxShadow: '0 4px 14px -6px rgba(0,0,0,.06)'
};

const groupTitle = { fontSize: '.7rem', fontWeight: 700, color: '#64748b', padding: '.25rem .5rem', margin: '.25rem 0' };
const linkBtn = {
  display: 'block',
  textDecoration: 'none',
  color: '#0f172a',
  padding: '.5rem .6rem',
  borderRadius: 8,
  fontSize: '.8rem'
};
const linkActive = { ...linkBtn, background: '#f1f5f9', fontWeight: 600 };

export default function AdminSideNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const params = new URLSearchParams(location.search || '');
  const currentView = params.get('view') || 'overview';
  const prefix = pathname.startsWith('/en') ? '/en' : (pathname.startsWith('/fr') ? '/fr' : '');
  const isActive = (to) => pathname === to;
  const isAdminPage = pathname === `${prefix}/admin` || pathname === `${prefix}/admin/`;
  const isAdminViewActive = (view) => isAdminPage && (currentView === (view || 'overview'));
  return (
    <nav style={navWrap} aria-label="Admin navigation">
      <div style={groupTitle}>الرئيسية</div>
      <a href={`${prefix}/admin`} style={isAdminViewActive('overview') ? linkActive : linkBtn}>نظرة عامة</a>

  <div style={groupTitle}>الأشخاص</div>
      <a href={`${prefix}/admin/users`} style={isActive(`${prefix}/admin/users`) ? linkActive : linkBtn}>المستخدمون (الطاقم)</a>
      <a href={`${prefix}/admin/customers`} style={isActive(`${prefix}/admin/customers`) ? linkActive : linkBtn}>العملاء</a>

      <div style={groupTitle}>لوحة التحكم</div>
  <a href={`${prefix}/admin?view=products`} style={isAdminViewActive('products') ? linkActive : linkBtn}>المنتجات</a>
      <a href={`${prefix}/admin?view=orders`} style={isAdminViewActive('orders') ? linkActive : linkBtn}>الطلبات</a>
      <a href={`${prefix}/admin?view=audit`} style={isAdminViewActive('audit') ? linkActive : linkBtn}>السجلات</a>
      <a href={`${prefix}/admin?view=reviews`} style={isAdminViewActive('reviews') ? linkActive : linkBtn}>المراجعات</a>
      <a href={`${prefix}/admin?view=brands`} style={isAdminViewActive('brands') ? linkActive : linkBtn}>العلامات</a>
      <a href={`${prefix}/admin?view=offers`} style={isAdminViewActive('offers') ? linkActive : linkBtn}>العروض</a>
      <a href={`${prefix}/admin?view=marketing`} style={isAdminViewActive('marketing') ? linkActive : linkBtn}>التسويق</a>
      <a href={`${prefix}/admin?view=settings`} style={isAdminViewActive('settings') ? linkActive : linkBtn}>الإعدادات</a>
      <a href={`${prefix}/admin?view=cats`} style={isAdminViewActive('cats') ? linkActive : linkBtn}>التصنيفات</a>
    </nav>
  );
}
