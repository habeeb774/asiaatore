import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Seo from '../../components/Seo';
import api from '../../api/client';
import { Button, ButtonLink, Input } from '../../components/ui';
import Panel from '../../components/ui/Panel';

// Elegant, unified form styles
const fieldCls = 'w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/70 focus:border-emerald-400 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-100';
const labelCls = 'block text-[13px] font-semibold mb-2 text-gray-700 dark:text-gray-200';

const Profile = () => {
  const { user, logout } = useAuth() || {};
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

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
      } catch (e) {
        if (mounted) setError(e.message || 'فشل تحميل البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setOk('');
    try {
      const patch = { name: form.name, phone: form.phone };
      await api.meUpdate(patch);
      setOk(locale==='ar' ? 'تم حفظ البيانات بنجاح' : 'Saved successfully');
    } catch (e) {
      setError(e.message || (locale==='ar' ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const siteTitle = locale==='ar' ? 'ملفي الشخصي' : 'My Profile';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Seo title={siteTitle} description={siteTitle} />

      {/* Luxe hero header */}
      <div className="container-custom px-4 pt-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/30 text-white backdrop-blur flex items-center justify-center font-bold">
                {(form.name || user?.name || 'U').slice(0,1)}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">{siteTitle}</h1>
                <p className="text-black/85 text-sm">
                  {locale==='ar' ? 'مرحبًا' : 'Welcome'},
                  {' '}
                  <span className="text-sky-200 font-semibold">{form.name || user?.name || (locale==='ar'?'ضيف':'Guest')}</span>
                </p>
              </div>
              <div className="ms-auto flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                  {locale==='ar' ? 'متصل' : 'Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),360px] gap-6">
          <Panel as="section">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200/80 dark:bg-gray-700 rounded w-1/4 mb-3" />
                  <div className="h-11 bg-gray-200/60 dark:bg-gray-700/80 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {error}
                </div>
              )}
              {ok && (
                <div className="text-sm rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3">
                  {ok}
                </div>
              )}

              <Input name="name" label={locale==='ar' ? 'الاسم' : 'Name'} value={form.name} onChange={onChange} required />
              <Input name="email" label={locale==='ar' ? 'البريد الإلكتروني' : 'Email'} value={form.email} readOnly className="bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">{locale==='ar' ? 'البريد غير قابل للتعديل' : 'Email is not editable'}</p>
              <Input name="phone" label={locale==='ar' ? 'رقم الجوال' : 'Phone'} value={form.phone} onChange={onChange} placeholder={locale==='ar'?'05xxxxxxxx':'05xxxxxxxx'} />
              <div className="flex gap-3 pt-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (locale==='ar' ? 'جارِ الحفظ...' : 'Saving...') : (locale==='ar' ? 'حفظ' : 'Save')}
                </Button>
                <ButtonLink to="/account/security" variant="outline">
                  {locale==='ar' ? 'الأمان وكلمة المرور' : 'Security & Password'}
                </ButtonLink>
              </div>
            </form>
          )}
          </Panel>

          <Panel as="aside" className="h-fit lg:sticky lg:top-6">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">{locale==='ar' ? 'روابط سريعة' : 'Quick links'}</h3>
            <div className="flex flex-col gap-3">
              <ButtonLink to="/my-orders" variant="outline">{locale==='ar' ? 'طلباتي' : 'My Orders'}</ButtonLink>
              <ButtonLink to="/offers" variant="outline">{locale==='ar' ? 'العروض' : 'Offers'}</ButtonLink>
              <Button onClick={logout} variant="destructive">{locale==='ar' ? 'تسجيل الخروج' : 'Logout'}</Button>
            </div>
            {user?.role && (
              <div className="mt-5 text-xs text-gray-600 dark:text-gray-300">
                <div>{locale==='ar' ? 'الدور:' : 'Role:'} <strong className="text-gray-900 dark:text-gray-100">{user.role}</strong></div>
              </div>
            )}
          </Panel>
      </div>
    </div>
    </div>
  );
};

export default Profile;
