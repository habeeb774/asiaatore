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
  { to: '/admin/products', label: 'المنتجات', icon: Package, view: 'products' },
  { to: '/admin/orders', label: 'الطلبات', icon: ShoppingBag, view: 'orders' },
  { to: '/admin/sellers', label: 'البائعون', icon: UserCircle, view: 'sellers' },
  { to: '/admin/audit', label: 'السجلات', icon: FileText, view: 'audit' },
  { to: '/admin/reviews', label: 'المراجعات', icon: Star, view: 'reviews' },
  { to: '/admin/brands', label: 'العلامات', icon: Tag, view: 'brands' },
  // Offers page not implemented yet — keep link removed to avoid confusion
  { to: '/admin/ads', label: 'الإعلانات', icon: Megaphone, view: 'ads' },
  { to: '/admin/marketing', label: 'التسويق', icon: Megaphone, view: 'marketing' },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings, view: 'settings' },
  { to: '/admin/categories', label: 'التصنيفات', icon: Grid, view: 'cats' },
  { to: '/admin/sellers/kyc', label: 'مراجعة KYC', icon: UserCircle, view: 'sellers_kyc' },
];

export default adminLinks;
// file intentionally exports a single adminLinks array above.
