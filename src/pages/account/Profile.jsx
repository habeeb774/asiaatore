import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Seo from '../../components/Seo';
import api from '../../api/client';

const fieldCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full text-sm';
const labelCls = 'block text-sm font-semibold mb-1';

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
    <div className="container-custom px-4 py-8">
      <Seo title={siteTitle} description={siteTitle} />
      <h1 className="text-2xl font-bold mb-4">{siteTitle}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {loading ? (
            <p className="text-sm text-gray-600">{locale==='ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}
              {ok && <div className="text-sm text-green-700">{ok}</div>}

              <div>
                <label className={labelCls}>{locale==='ar' ? 'الاسم' : 'Name'}</label>
                <input name="name" value={form.name} onChange={onChange} className={fieldCls} required />
              </div>
              <div>
                <label className={labelCls}>{locale==='ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input name="email" value={form.email} readOnly className={`${fieldCls} bg-gray-50`} />
                <p className="text-xs text-gray-500 mt-1">{locale==='ar' ? 'البريد غير قابل للتعديل' : 'Email is not editable'}</p>
              </div>
              <div>
                <label className={labelCls}>{locale==='ar' ? 'رقم الجوال' : 'Phone'}</label>
                <input name="phone" value={form.phone} onChange={onChange} className={fieldCls} placeholder={locale==='ar'?'05xxxxxxxx':'05xxxxxxxx'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">
                  {saving ? (locale==='ar' ? 'جارِ الحفظ...' : 'Saving...') : (locale==='ar' ? 'حفظ' : 'Save')}
                </button>
                <Link to="/account/security" className="btn-outline px-5 py-2 text-sm">{locale==='ar' ? 'الأمان وكلمة المرور' : 'Security & Password'}</Link>
              </div>
            </form>
          )}
        </section>

        <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit">
          <h3 className="font-bold mb-3">{locale==='ar' ? 'روابط سريعة' : 'Quick links'}</h3>
          <div className="flex flex-col gap-2">
            <Link to="/my-orders" className="btn-outline text-sm">{locale==='ar' ? 'طلباتي' : 'My Orders'}</Link>
            <Link to="/offers" className="btn-outline text-sm">{locale==='ar' ? 'العروض' : 'Offers'}</Link>
            <button onClick={logout} className="btn-outline text-sm">{locale==='ar' ? 'تسجيل الخروج' : 'Logout'}</button>
          </div>
          {user?.role && (
            <div className="mt-4 text-xs text-gray-600">
              <div>{locale==='ar' ? 'الدور:' : 'Role:'} <strong>{user.role}</strong></div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Profile;
