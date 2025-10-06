import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/client';

const Settings = () => {
  const { setting, loading, error, update, uploadLogo } = useSettings();
  const [form, setForm] = useState({ siteNameAr:'', siteNameEn:'', colorPrimary:'#69be3c', colorSecondary:'#2eafff', colorAccent:'#2eafff' });
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState('');
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (setting) {
      setForm(f => ({
        ...f,
        siteNameAr: setting.siteNameAr || '',
        siteNameEn: setting.siteNameEn || '',
        colorPrimary: setting.colorPrimary || f.colorPrimary,
        colorSecondary: setting.colorSecondary || f.colorSecondary,
        colorAccent: setting.colorAccent || f.colorAccent
      }));
    }
  }, [setting]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const s = await update(form);
      if (logoFile) {
        await uploadLogo(logoFile);
        setLogoFile(null);
      }
      setMsg('تم الحفظ بنجاح');
    } catch (e) {
      setMsg('فشل الحفظ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = useMemo(() => ({
    '--color-primary': form.colorPrimary,
    '--color-primary-alt': form.colorSecondary,
    '--color-accent': form.colorAccent
  }), [form.colorPrimary, form.colorSecondary, form.colorAccent]);

  const uploadLogoNow = async () => {
    if (!logoFile) { setMsg('الرجاء اختيار صورة الشعار أولاً'); return; }
    setUploadingLogo(true); setMsg('');
    try {
      await uploadLogo(logoFile);
      setLogoFile(null);
      setMsg('تم رفع الشعار بنجاح');
    } catch (e) {
      setMsg('فشل رفع الشعار: ' + e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="admin-page-wrapper">
      <Seo title="الإعدادات | Settings" description="Store settings" />
      <h1 className="page-title">الإعدادات / Settings</h1>
      {loading ? (
        <p>يتم التحميل...</p>
      ) : error ? (
        <p className="error">خطأ: {error}</p>
      ) : (
        <form onSubmit={submit} className="settings-form" style={{display:'grid', gap:12, maxWidth:720}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>اسم المتجر (AR)</span>
              <input value={form.siteNameAr} onChange={e=>onChange('siteNameAr', e.target.value)} placeholder="مثال: متجر النخبة" />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>Store Name (EN)</span>
              <input value={form.siteNameEn} onChange={e=>onChange('siteNameEn', e.target.value)} placeholder="e.g., Elite Store" />
            </label>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            <label style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الأساسي</span>
              <input type="color" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
              <input value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الثانوي</span>
              <input type="color" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
              <input value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>لون مميز</span>
              <input type="color" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
              <input value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
            </label>
          </div>

          <div style={{display:'grid', gap:6}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الشعار</span>
            <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
              {setting?.logo && <img src={setting.logo} alt="logo" style={{height:48, objectFit:'contain'}} />}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={e=> setLogoFile(e.target.files?.[0]||null)} style={{display:'none'}} />
              <button type="button" onClick={()=> logoInputRef.current?.click()} style={{background:'#e2e8f0', color:'#0f172a', border:0, padding:'6px 10px', borderRadius:8, fontWeight:700}}>
                اختر صورة من جهازك
              </button>
              {logoFile && <span style={{fontSize:'.6rem'}}>{logoFile.name}</span>}
              <button type="button" onClick={uploadLogoNow} disabled={!logoFile || uploadingLogo} style={{background:'#0ea5e9', color:'#fff', border:0, padding:'6px 10px', borderRadius:8, fontWeight:700}}>
                {uploadingLogo ? 'يرفع...' : 'رفع الشعار'}
              </button>
            </div>
          </div>

          <div style={{display:'grid', gap:6}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>معاينة مباشرة</span>
            <div style={{...previewStyle, display:'flex', alignItems:'center', gap:12, padding:12, border:'1px dashed #e2e8f0', borderRadius:8}}>
              <div style={{width:56, height:56, background:'var(--color-primary)', borderRadius:8}} />
              <div style={{width:56, height:56, background:'var(--color-primary-alt)', borderRadius:8}} />
              <div style={{width:56, height:56, background:'var(--color-accent)', borderRadius:8}} />
              <span style={{fontWeight:700}}>{form.siteNameAr || form.siteNameEn || 'اسم المتجر'}</span>
              <button type="button" style={{marginInlineStart:'auto', background:'var(--color-primary)', color:'#fff', border:'0', borderRadius:8, padding:'6px 10px', fontWeight:700}}>زر تجريبي</button>
            </div>
          </div>

          <div style={{display:'flex', gap:8}}>
            <button type="submit" disabled={saving} style={{background:'#0ea5e9', color:'#fff', border:0, padding:'8px 14px', borderRadius:8, fontWeight:700}}>
              {saving ? 'يحفظ...' : 'حفظ التغييرات'}
            </button>
            {msg && <span style={{fontSize:'.75rem'}}>{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
};
export default Settings;
