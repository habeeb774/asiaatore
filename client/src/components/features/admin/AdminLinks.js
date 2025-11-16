import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  ShoppingBag,
  FileText,
  Star,
  Tag,
  Percent,
  Megaphone,
  Settings,
  Grid,
} from 'lucide-react';

export const adminLinks = [
  { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, view: 'overview' },
  { to: '/admin/users', label: 'المستخدمون', icon: Users, view: 'users' },
  { to: '/admin/customers', label: 'العملاء', icon: UserCircle, view: 'customers' },
  { to: '/admin?view=products', label: 'المنتجات', icon: Package, view: 'products' },
  { to: '/admin?view=orders', label: 'الطلبات', icon: ShoppingBag, view: 'orders' },
  { to: '/admin?view=audit', label: 'السجلات', icon: FileText, view: 'audit' },
  { to: '/admin?view=reviews', label: 'المراجعات', icon: Star, view: 'reviews' },
  { to: '/admin?view=brands', label: 'العلامات', icon: Tag, view: 'brands' },
  { to: '/admin?view=offers', label: 'العروض', icon: Percent, view: 'offers' },
  { to: '/admin?view=ads', label: 'الإعلانات', icon: Megaphone, view: 'ads' },
  { to: '/admin?view=marketing', label: 'التسويق', icon: Megaphone, view: 'marketing' },
  { to: '/admin?view=settings', label: 'الإعدادات', icon: Settings, view: 'settings' },
  { to: '/admin?view=cats', label: 'التصنيفات', icon: Grid, view: 'cats' },
];

export default adminLinks;
// file intentionally exports a single adminLinks array above.
