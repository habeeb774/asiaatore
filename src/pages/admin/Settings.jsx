import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/client';

const Settings = () => {
  const { setting, loading, error, update, uploadLogo } = useSettings();
  const [form, setForm] = useState({
    siteNameAr:'', siteNameEn:'',
    colorPrimary:'#69be3c', colorSecondary:'#2eafff', colorAccent:'#2eafff',
    taxNumber:'',
    supportPhone:'', supportMobile:'', supportWhatsapp:'', supportEmail:'', supportHours:'',
    footerAboutAr:'', footerAboutEn:'',
    linkBlog:'', linkSocial:'', linkReturns:'', linkPrivacy:'',
    appStoreUrl:'', playStoreUrl:''
  });
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
        colorAccent: setting.colorAccent || f.colorAccent,
        taxNumber: setting.taxNumber || '',
        supportPhone: setting.supportPhone || '',
        supportMobile: setting.supportMobile || '',
        supportWhatsapp: setting.supportWhatsapp || '',
        supportEmail: setting.supportEmail || '',
        supportHours: setting.supportHours || '',
        footerAboutAr: setting.footerAboutAr || '',
        footerAboutEn: setting.footerAboutEn || '',
        linkBlog: setting.linkBlog || '',
        linkSocial: setting.linkSocial || '',
        linkReturns: setting.linkReturns || '',
        linkPrivacy: setting.linkPrivacy || '',
        appStoreUrl: setting.appStoreUrl || '',
        playStoreUrl: setting.playStoreUrl || ''
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
        <form onSubmit={submit} className="settings-form" style={{display:'grid', gap:12, maxWidth:820}}>
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

          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>معلومات التواصل</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الهاتف (هاتف)</span>
                <input value={form.supportPhone} onChange={e=>onChange('supportPhone', e.target.value)} placeholder="مثال: 920000000" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الجوال (Mobile)</span>
                <input value={form.supportMobile} onChange={e=>onChange('supportMobile', e.target.value)} placeholder="مثال: +9665XXXXXXXX" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>واتساب (أرقام فقط)</span>
                <input value={form.supportWhatsapp}
                  onChange={e=>onChange('supportWhatsapp', e.target.value)}
                  onBlur={e=> onChange('supportWhatsapp', e.target.value.replace(/\D+/g,''))}
                  placeholder="مثال: 9665XXXXXXXX" />
                <small style={{opacity:.7}}>سيستخدم كرابط wa.me/الرقم</small>
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>البريد الإلكتروني</span>
                <input type="email" value={form.supportEmail} onChange={e=>onChange('supportEmail', e.target.value)} placeholder="support@example.com" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>ساعات العمل (اختياري)</span>
                <input value={form.supportHours} onChange={e=>onChange('supportHours', e.target.value)} placeholder="مثال: 9ص - 6م (السبت-الخميس)" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي (اختياري)</span>
                <input value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
              </label>
            </div>
          </div>

          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>وصف الفوتر</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>نبذة (AR)</span>
                <textarea rows={4} value={form.footerAboutAr} onChange={e=>onChange('footerAboutAr', e.target.value)} placeholder={"متخصصون في بيع المواد الغذائية بالجملة وبالحبة\nوجميع احتياجات المنزل من منظفات و كماليات\nأيضًا يوجد لدينا قسم السوبر ماركت وجميع\nاحتياجات الأسرة السعودية وأسعارنا جملة وجودتنا\nأصلية"} />
                <small style={{opacity:.7}}>يمكنك كتابة عدة أسطر؛ ستظهر كفقرات منفصلة.</small>
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>About (EN)</span>
                <textarea rows={4} value={form.footerAboutEn} onChange={e=>onChange('footerAboutEn', e.target.value)} placeholder="We specialize in wholesale and retail food products and home essentials." />
              </label>
            </div>
          </div>

          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>روابط مهمة وتطبيقات</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط المدونة (Blog)</span>
                <input type="url" value={form.linkBlog} onChange={e=>onChange('linkBlog', e.target.value)} placeholder="https://example.com/blog" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط التواصل الاجتماعي</span>
                <input type="url" value={form.linkSocial} onChange={e=>onChange('linkSocial', e.target.value)} placeholder="https://instagram.com/yourbrand" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستبدال والإرجاع</span>
                <input type="url" value={form.linkReturns} onChange={e=>onChange('linkReturns', e.target.value)} placeholder="https://example.com/returns" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستخدام والخصوصية</span>
                <input type="url" value={form.linkPrivacy} onChange={e=>onChange('linkPrivacy', e.target.value)} placeholder="https://example.com/privacy" />
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق iOS (App Store)</span>
                <input type="url" value={form.appStoreUrl} onChange={e=>onChange('appStoreUrl', e.target.value)} placeholder="https://apps.apple.com/app/idXXXXXXXXX" />
                <small style={{opacity:.7}}>استخدم رابط App Store الرسمي للتطبيق.</small>
              </label>
              <label style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق Android (Google Play)</span>
                <input type="url" value={form.playStoreUrl} onChange={e=>onChange('playStoreUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=your.app" />
                <small style={{opacity:.7}}>استخدم رابط Google Play الرسمي للتطبيق.</small>
              </label>
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
