import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { UserCircle2, BellRing, ShieldCheck, LogOut, ArrowRight, ShieldHalf, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProfileSkeleton } from '../../components/shared/PageSkeletons';
import Seo from '../../components/Seo';
import api from '../../services/api/client';
import { Button, ButtonLink, Input } from '../../components/ui';
import Panel from '../../components/ui/Panel';

const Profile = () => {
  const { user, logout } = useAuth() || {};
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({ email: true, sms: false, offers: true, orders: true });
  const [feedback, setFeedback] = useState({ tab: '', type: '', message: '' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const hydrate = async () => {
      try {
        const res = await api.me();
        const u = res?.user || res || {};
        if (mounted) {
          setForm({ name: u.name || user?.name || '', email: u.email || user?.email || '', phone: u.phone || '' });
        }

        try {
          const prefsRes = await api.notificationsPreferencesGet();
          if (prefsRes && mounted) {
            setNotifications(prev => ({ ...prev, ...prefsRes }));
          }
        } catch (e) {
          console.warn('Failed to load notification preferences:', e);
        }
      } catch (e) {
        if (mounted) {
          setFeedback({ tab: 'profile', type: 'error', message: e.message || (locale === 'ar' ? 'فشل تحميل البيانات' : 'Unable to load profile data') });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrate();
    return () => { mounted = false; };
  }, [user, locale]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFeedback({ tab: '', type: '', message: '' });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ tab: '', type: '', message: '' });
    try {
      const patch = { name: form.name, phone: form.phone };
      await api.meUpdate(patch);
      setFeedback({ tab: 'profile', type: 'success', message: locale === 'ar' ? 'تم حفظ بياناتك بنجاح' : 'Profile updated successfully' });
    } catch (error) {
      setFeedback({ tab: 'profile', type: 'error', message: error.message || (locale === 'ar' ? 'تعذر حفظ البيانات' : 'Could not save changes') });
    } finally {
      setSaving(false);
    }
  };

  const onSaveNotifications = async (e) => {
    e.preventDefault();
    setSavingNotifications(true);
    setFeedback({ tab: '', type: '', message: '' });
    try {
      await api.notificationsPreferencesUpdate(notifications);
      setFeedback({ tab: 'notifications', type: 'success', message: locale === 'ar' ? 'تم حفظ تفضيلات الإشعارات' : 'Notification preferences updated' });
    } catch (error) {
      setFeedback({ tab: 'notifications', type: 'error', message: error.message || (locale === 'ar' ? 'تعذر حفظ تفضيلات الإشعارات' : 'Could not save notification preferences') });
    } finally {
      setSavingNotifications(false);
    }
  };

  const siteTitle = locale === 'ar' ? 'ملفي الشخصي' : 'My Profile';
  const greeting = locale === 'ar' ? 'مرحبًا' : 'Welcome back';
  const heroDescription = locale === 'ar'
    ? 'حدث بياناتك، راجع إشعاراتك، وابقَ مطمئنًا بشأن أمان حسابك من مكان واحد.'
    : 'Keep your details up to date, fine-tune alerts, and stay on top of account security in one place.';

  const navItems = useMemo(() => ([
    {
      key: 'profile',
      label: locale === 'ar' ? 'الملف الشخصي' : 'Profile',
      description: locale === 'ar' ? 'بياناتك الأساسية وطرق التواصل' : 'Personal details & contact info',
      icon: UserCircle2
    },
    {
      key: 'notifications',
      label: locale === 'ar' ? 'الإشعارات' : 'Notifications',
      description: locale === 'ar' ? 'تحكم في الإشعارات التي تستلمها' : 'Choose when we should notify you',
      icon: BellRing
    },
    {
      key: 'security',
      label: locale === 'ar' ? 'الأمان' : 'Security',
      description: locale === 'ar' ? 'خطوات لتعزيز حماية حسابك' : 'Keep your account protected',
      icon: ShieldCheck
    }
  ]), [locale]);

  const avatarUrl = user?.avatar || user?.image || user?.photoURL || '';
  const displayName = form.name || user?.name || (locale === 'ar' ? 'ضيف' : 'Guest');
  const initials = displayName.slice(0, 2).toUpperCase();
  const activeFeedback = feedback.tab === activeTab ? feedback : null;

  const Field = ({ id, label, description, children }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      {children}
      {description ? <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
    </div>
  );

  const renderNotificationToggle = (name, title, description) => (
    <label
      key={name}
      className="relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-30px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="space-y-1">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={Boolean(notifications[name])}
          onChange={onNotificationChange}
          className="peer sr-only"
        />
        <span className="flex h-7 w-14 items-center rounded-full bg-slate-300/50 transition peer-checked:bg-emerald-500/80">
          <span className="ml-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:ml-8" />
        </span>
      </div>
    </label>
  );

  const securityCards = [
    {
      title: locale === 'ar' ? 'تأكيد الهوية' : 'Verify your identity',
      copy: locale === 'ar'
        ? 'حدّث كلمة المرور بانتظام واستخدم كلمات مرور معقدة لحماية بياناتك.'
        : 'Update your password frequently and keep it complex to protect your data.',
      action: locale === 'ar' ? 'إدارة كلمة المرور' : 'Manage password',
      href: '/account/security'
    },
    {
      title: locale === 'ar' ? 'تفعيل التنبيهات' : 'Enable alerts',
      copy: locale === 'ar'
        ? 'احصل على تنبيهات فورية في حال تسجيل الدخول من جهاز جديد أو تغييرات حساسة.'
        : 'Get instant alerts if a new device signs in or sensitive changes occur.',
      action: locale === 'ar' ? 'إعداد التنبيهات' : 'Configure alerts',
      href: '/account/security'
    }
  ];

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      if (loading) {
        return <ProfileSkeleton />;
      }

      return (
        <motion.form
          key="profile"
          onSubmit={onSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {activeFeedback?.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                activeFeedback.type === 'error'
                  ? 'border border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
                  : 'border border-emerald-200/70 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              {activeFeedback.message}
            </motion.div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field id="profile-name" label={locale === 'ar' ? 'الاسم الكامل' : 'Full name'}>
              <Input
                id="profile-name"
                name="name"
                value={form.name}
                onChange={onChange}
                required
                placeholder={locale === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                className="rounded-2xl border border-slate-200/70 bg-white/80 py-3 text-sm shadow-[0_20px_35px_-28px_rgba(15,23,42,0.6)] transition focus-visible:border-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-200/50 dark:border-slate-700/60 dark:bg-slate-900/60"
              />
            </Field>
            <Field id="profile-phone" label={locale === 'ar' ? 'رقم الجوال' : 'Phone number'}>
              <Input
                id="profile-phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder={locale === 'ar' ? '05xxxxxxxx' : '05xxxxxxxx'}
                className="rounded-2xl border border-slate-200/70 bg-white/80 py-3 text-sm shadow-[0_20px_35px_-28px_rgba(15,23,42,0.6)] transition focus-visible:border-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-200/50 dark:border-slate-700/60 dark:bg-slate-900/60"
              />
            </Field>
          </div>

          <Field
            id="profile-email"
            label={locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            description={locale === 'ar' ? 'الحساب مرتبط بهذا البريد ولا يمكن تعديله.' : 'Your account is tied to this email and cannot be changed.'}
          >
            <Input
              id="profile-email"
              name="email"
              value={form.email}
              readOnly
              className="cursor-not-allowed rounded-2xl border border-slate-200/70 bg-slate-50/80 py-3 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-400"
            />
          </Field>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="submit" disabled={saving} className="sm:min-w-[160px]">
              {saving ? (locale === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : locale === 'ar' ? 'حفظ التغييرات' : 'Save changes'}
            </Button>
            <ButtonLink
              to="/account/security"
              variant="outline"
              className="sm:min-w-[180px]"
            >
              {locale === 'ar' ? 'إدارة الأمان وكلمة المرور' : 'Manage security & password'}
            </ButtonLink>
          </div>
        </motion.form>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <motion.form
          key="notifications"
          onSubmit={onSaveNotifications}
          className="space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {activeFeedback?.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                activeFeedback.type === 'error'
                  ? 'border border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
                  : 'border border-emerald-200/70 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              {activeFeedback.message}
            </motion.div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {locale === 'ar' ? 'اضبط إشعاراتك' : 'Fine-tune your alerts'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {locale === 'ar'
                ? 'اختر القنوات التي تفضل استقبال التحديثات من خلالها للحفاظ على تواصل فوري.'
                : 'Select the channels you prefer so you never miss an important update.'}
            </p>
          </div>

          <div className="grid gap-4">
            {renderNotificationToggle(
              'email',
              locale === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email notifications',
              locale === 'ar' ? 'تلقي رسائل حول الطلبات والعروض مباشرة إلى بريدك.' : 'Receive order and offer updates directly in your inbox.'
            )}
            {renderNotificationToggle(
              'sms',
              locale === 'ar' ? 'رسائل نصية (واتساب)' : 'SMS / WhatsApp alerts',
              locale === 'ar' ? 'استقبل رسائل فورية على جوالك بخصوص عمليات الشراء.' : 'Get instant texts to your phone for purchases and status changes.'
            )}
            {renderNotificationToggle(
              'offers',
              locale === 'ar' ? 'عروض وخصومات' : 'Offers & promotions',
              locale === 'ar' ? 'كن أول من يعرف عن التخفيضات والمنتجات الحصرية.' : 'Be first to hear about new deals and exclusive drops.'
            )}
            {renderNotificationToggle(
              'orders',
              locale === 'ar' ? 'تحديثات الطلبات' : 'Order status updates',
              locale === 'ar' ? 'تابع مراحل الطلب من الشحن وحتى التسليم.' : 'Track your orders from preparation to delivery.'
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={savingNotifications} className="min-w-[180px]">
              {savingNotifications ? (locale === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : locale === 'ar' ? 'حفظ التفضيلات' : 'Save preferences'}
            </Button>
          </div>
        </motion.form>
      );
    }

    return (
      <motion.div
        key="security"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_22px_55px_-32px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <ShieldHalf size={22} />
            </span>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {locale === 'ar' ? 'حافظ على أمان حسابك' : 'Keep your account protected'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {locale === 'ar'
                  ? 'قم بمراجعة إعدادات الأمان بانتظام، وتأكد من تفعيل المصادقة الثنائية وإضافة وسائل استرداد.'
                  : 'Review your security settings regularly. Enable two-factor authentication and add recovery methods to stay protected.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {securityCards.map((card) => (
            <div
              key={card.title}
              className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] transition hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-slate-900/70"
            >
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.copy}</p>
              </div>
              <ButtonLink to={card.href} variant="outline" className="mt-auto inline-flex items-center gap-2 text-sm">
                {card.action}
                <ArrowRight size={16} />
              </ButtonLink>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/account/security" className="inline-flex items-center gap-2">
            {locale === 'ar' ? 'لوحة الأمان الكاملة' : 'Open security dashboard'}
            <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink to="/account/security/devices" variant="outline" className="inline-flex items-center gap-2">
            {locale === 'ar' ? 'الأجهزة المرتبطة' : 'Manage trusted devices'}
          </ButtonLink>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Seo title={siteTitle} description={siteTitle} />

      <section className="container-custom px-4 pt-10">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white shadow-[0_45px_90px_-45px_rgba(14,116,144,0.7)]">
          <span className="pointer-events-none absolute -top-20 right-[-12%] h-40 w-40 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-16 left-[-10%] h-48 w-48 rounded-full bg-sky-400/30 blur-3xl" aria-hidden="true" />

          <div className="relative z-10 flex flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 shadow-lg" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                </span>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-3xl border-2 border-white/60 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/25 text-xl font-bold text-white shadow-lg">
                    {initials}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                  <Sparkles size={14} />
                  {greeting}
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{siteTitle}</h1>
                <p className="max-w-xl text-sm text-white/85 md:text-base">{heroDescription}</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-white/90 md:text-right">
              <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-inner">
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">{locale === 'ar' ? 'الحساب' : 'Account'}</p>
                <p className="font-semibold">{displayName}</p>
                <p className="text-white/75">{form.email || user?.email}</p>
              </div>
              <ButtonLink
                to="/my-orders"
                variant="outline"
                className="inline-flex items-center justify-center gap-2 border-white/50 text-white hover:border-white"
              >
                {locale === 'ar' ? 'عرض الطلبات' : 'View recent orders'}
                <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="container-custom px-4 pb-16 pt-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Panel
            as="aside"
            className="flex h-full flex-col gap-6 rounded-[28px] border-0 bg-gradient-to-br from-white via-emerald-50/80 to-sky-50/80 p-6 shadow-[0_28px_75px_-48px_rgba(16,185,129,0.55)] ring-1 ring-emerald-100/70 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/70 dark:to-slate-950/85 dark:ring-slate-800/60"
          >
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabChange(item.key)}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-sky-500/20 text-emerald-700 shadow-[0_16px_35px_-20px_rgba(16,185,129,0.7)] dark:text-emerald-200'
                        : 'text-slate-600 hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-emerald-600 shadow-md transition dark:bg-white/10 ${isActive ? 'bg-white text-emerald-600 dark:bg-white/20' : ''}`}>
                      <Icon size={18} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="rounded-2xl border-0 bg-gradient-to-br from-white via-emerald-50/60 to-white/90 p-5 shadow-[0_20px_55px_-44px_rgba(16,185,129,0.45)] ring-1 ring-emerald-100/60 dark:bg-gradient-to-br dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/80 dark:ring-slate-800/60">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {locale === 'ar' ? 'روابط سريعة' : 'Quick actions'}
              </h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <ButtonLink to="/my-orders" variant="outline" className="justify-between">
                  {locale === 'ar' ? 'طلباتي' : 'My orders'}
                  <ArrowRight size={14} />
                </ButtonLink>
                <ButtonLink to="/offers" variant="outline" className="justify-between">
                  {locale === 'ar' ? 'العروض الحصرية' : 'Exclusive offers'}
                  <ArrowRight size={14} />
                </ButtonLink>
              </div>
            </div>

            <Button
              onClick={logout}
              variant="danger"
              className="mt-auto inline-flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            </Button>

            {user?.role && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {locale === 'ar' ? 'دور الحساب:' : 'Account role:'}
                {' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{user.role}</span>
              </div>
            )}
          </Panel>

          <Panel
            as="section"
            className="relative overflow-hidden rounded-[28px] border-0 bg-gradient-to-br from-white via-emerald-50/70 to-white p-6 shadow-[0_30px_90px_-48px_rgba(16,185,129,0.5)] ring-1 ring-emerald-100/80 dark:bg-gradient-to-br dark:from-slate-950/85 dark:via-slate-900/70 dark:to-slate-950/85 dark:ring-slate-800/60"
          >
            <AnimatePresence mode="wait" initial={false}>
              {renderTabContent()}
            </AnimatePresence>
          </Panel>
        </div>
      </section>
    </div>
  );
};

export default Profile;
