import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { adminQuickLinks } from '../../../components/features/admin/AdminLinks';

const AdminNavigation = () => {
  const { locale } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = React.useMemo(() => adminQuickLinks, []);
  const currentPath = location.pathname;

  return (
    <nav className="admin-navigation">
      <div className="nav-items">
        {navItems.map(item => (
          <button
            key={item.to}
            className={`nav-item ${currentPath === item.to || currentPath.startsWith(`${item.to}/`) ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
          >
            {locale === 'ar' ? item.labelAr : (item.labelEn || item.labelAr)}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default AdminNavigation;
