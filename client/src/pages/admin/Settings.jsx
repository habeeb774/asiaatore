import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';

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
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});
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

  // Helpers: basic validation
  const isHex = (s) => /^#([0-9a-fA-F]{6})$/.test(String(s || ''));
  const isEmail = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
  const isUrl = (s) => {
    if (!s) return true;
    try { new URL(s); return true; } catch { return false; }
  };
  const isDigits = (s) => !s || /^[0-9+\s-]+$/.test(String(s));

  const validate = () => {
    const e = {};
    if (!form.siteNameAr && !form.siteNameEn) e.siteNameEn = 'يرجى إدخال اسم المتجر';
    if (!isHex(form.colorPrimary)) e.colorPrimary = 'الرجاء إدخال لون بصيغة #RRGGBB';
    if (!isHex(form.colorSecondary)) e.colorSecondary = 'الرجاء إدخال لون بصيغة #RRGGBB';
    if (!isHex(form.colorAccent)) e.colorAccent = 'الرجاء إدخال لون بصيغة #RRGGBB';
    if (!isEmail(form.supportEmail)) e.supportEmail = 'صيغة بريد غير صحيحة';
    if (!isUrl(form.linkBlog)) e.linkBlog = 'رابط غير صحيح';
    if (!isUrl(form.linkSocial)) e.linkSocial = 'رابط غير صحيح';
    if (!isUrl(form.linkReturns)) e.linkReturns = 'رابط غير صحيح';
    if (!isUrl(form.linkPrivacy)) e.linkPrivacy = 'رابط غير صحيح';
    if (!isUrl(form.appStoreUrl)) e.appStoreUrl = 'رابط غير صحيح';
    if (!isUrl(form.playStoreUrl)) e.playStoreUrl = 'رابط غير صحيح';
    if (!isDigits(form.supportPhone)) e.supportPhone = 'أرقام فقط مسموحة';
    if (!isDigits(form.supportMobile)) e.supportMobile = 'أرقام فقط مسموحة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      if (!validate()) { setMsg('يرجى تصحيح الحقول المظللة'); setSaving(false); return; }
      // Only send changed fields that are not empty (unless original was also empty/null)
      const changed = {};
      if (setting) {
        Object.keys(form).forEach(k => {
          if (form[k] !== setting[k] && (form[k] !== '' || (setting[k] !== undefined && setting[k] !== null && setting[k] !== ''))) {
            changed[k] = form[k];
          }
        });
      } else {
        Object.assign(changed, form);
      }
      if (Object.keys(changed).length === 0 && !logoFile) {
        setMsg('لا يوجد تغييرات للحفظ'); setSaving(false); return;
      }
      // إذا لم تتغير الحقول النصية لكن يوجد شعار جديد، اعتبرها عملية حفظ
      if (Object.keys(changed).length === 0 && logoFile) {
        // فقط شعار جديد، أكمل بدون رسالة "لا يوجد تغييرات"
      }
      if (Object.keys(changed).length > 0) {
        await update(changed);
      }
      if (logoFile) {
        await uploadLogo(logoFile);
        setLogoFile(null);
        if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      }
      setMsg('تم الحفظ بنجاح');
    } catch (e) {
      let msg = '';
      const errMsg = (e && e.message) ? String(e.message) : '';
      const details = (e && e.data && e.data.message) ? String(e.data.message) : '';
      if (errMsg.includes('connect ECONNREFUSED') || details.includes('connect ECONNREFUSED')) {
        msg = 'فشل الاتصال بقاعدة البيانات أو الملقم البعيد. يرجى التأكد من الاتصال والمحاولة لاحقاً.';
      } else if (errMsg.includes('FORBIDDEN') || details.includes('Admin only')) {
        msg = 'ليس لديك صلاحية تنفيذ هذا الإجراء. يجب أن تكون أدمن.';
      } else if (errMsg.includes('UPDATE_FAILED') && details.includes('does not exist')) {
        msg = 'جدول الإعدادات غير موجود في قاعدة البيانات. يرجى مزامنة قاعدة البيانات أولاً.';
      } else if (errMsg.includes('UNAUTHENTICATED') || details.includes('UNAUTHENTICATED')) {
        msg = 'يجب تسجيل الدخول أولاً.';
      } else if (errMsg.includes('NOT_FOUND') || details.includes('NOT_FOUND')) {
        msg = 'العنصر المطلوب غير موجود.';
      } else if (errMsg.includes('INVALID') || details.includes('INVALID')) {
        msg = 'يرجى التأكد من صحة البيانات المدخلة.';
      } else if (errMsg.includes('password') || details.includes('password')) {
        msg = 'يرجى التأكد من اسم المستخدم أو كلمة المرور.';
      } else if (details) {
        msg = 'فشل الحفظ: ' + details;
      } else if (errMsg) {
        msg = 'فشل الحفظ: ' + errMsg;
      } else {
        msg = 'حدث خطأ غير متوقع أثناء الحفظ.';
      }
      setMsg(msg);
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
      if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null); }
      setMsg('تم رفع الشعار بنجاح');
    } catch (e) {
      const code = e?.code ? ` (${e.code})` : '';
      const serverMsg = e?.data?.message || e?.message || '';
      setMsg('فشل رفع الشعار' + code + ': ' + serverMsg);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Live apply preview to document root (without saving)
  const applyPreviewToApp = () => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', form.colorPrimary);
      root.style.setProperty('--color-secondary', form.colorSecondary);
      root.style.setProperty('--color-accent', form.colorAccent);
      setMsg('تم تطبيق الألوان على المعاينة');
    } catch {}
  };

  const resetPreviewFromSetting = () => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', setting?.colorPrimary || '#69be3c');
      root.style.setProperty('--color-secondary', setting?.colorSecondary || '#2eafff');
      root.style.setProperty('--color-accent', setting?.colorAccent || '#2eafff');
      setMsg('تمت إعادة الألوان إلى القيم الحالية');
    } catch {}
  };

  const onPickLogo = (file) => {
    if (!file) { setLogoFile(null); if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoPreview(null); return; }
    // Simple validation: type and size (<= 2MB)
    const okType = /image\/(png|jpe?g|webp|svg\+xml)/.test(file.type);
    const okSize = file.size <= 2 * 1024 * 1024;
    if (!okType) { setMsg('صيغة الشعار يجب أن تكون PNG/JPG/WebP/SVG'); return; }
    if (!okSize) { setMsg('حجم الشعار يجب ألا يتجاوز 2MB'); return; }
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="admin-page-wrapper">
      <Seo title="الإعدادات | Settings" description="Store settings" />
      <h1 className="page-title">الإعدادات / Settings</h1>
      <div aria-live="polite" style={{minHeight:24, marginBottom:8, color: msg?.startsWith('فشل') ? '#dc2626' : '#0f766e'}}>{msg}</div>
      {loading ? (
        <p>يتم التحميل...</p>
      ) : error ? (
        <p className="error">خطأ: {error}</p>
      ) : (
        <form onSubmit={submit} className="settings-form" style={{display:'grid', gap:12, maxWidth:880}}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>معلومات المتجر</legend>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label htmlFor="siteNameAr" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>اسم المتجر (AR)</span>
                <input id="siteNameAr" value={form.siteNameAr} onChange={e=>onChange('siteNameAr', e.target.value)} placeholder="مثال: متجر النخبة" />
              </label>
              <label htmlFor="siteNameEn" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>Store Name (EN)</span>
                <input id="siteNameEn" value={form.siteNameEn} onChange={e=>onChange('siteNameEn', e.target.value)} placeholder="e.g., Elite Store" />
                {errors.siteNameEn && <small style={{color:'#dc2626'}}>{errors.siteNameEn}</small>}
              </label>
            </div>
          </fieldset>

          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>ألوان الهوية</legend>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
              <label htmlFor="colorPrimary" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الأساسي</span>
                <input id="colorPrimary" type="color" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
                <input aria-label="Hex" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
                {errors.colorPrimary && <small style={{color:'#dc2626'}}>{errors.colorPrimary}</small>}
              </label>
              <label htmlFor="colorSecondary" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الثانوي</span>
                <input id="colorSecondary" type="color" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
                <input aria-label="Hex" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
                {errors.colorSecondary && <small style={{color:'#dc2626'}}>{errors.colorSecondary}</small>}
              </label>
              <label htmlFor="colorAccent" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>لون مميز</span>
                <input id="colorAccent" type="color" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
                <input aria-label="Hex" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
                {errors.colorAccent && <small style={{color:'#dc2626'}}>{errors.colorAccent}</small>}
              </label>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="button" onClick={applyPreviewToApp} style={{background:'#22c55e', color:'#fff', border:0, padding:'6px 10px', borderRadius:8, fontWeight:700}}>تطبيق المعاينة</button>
              <button type="button" onClick={resetPreviewFromSetting} style={{background:'#94a3b8', color:'#0b0f19', border:0, padding:'6px 10px', borderRadius:8, fontWeight:700}}>إلغاء المعاينة</button>
            </div>
          </fieldset>

          <div style={{display:'grid', gap:6}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الشعار</span>
            <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
              {(logoPreview || setting?.logoUrl || setting?.logo) && <img src={logoPreview || setting.logoUrl || setting.logo} alt="logo" style={{height:48, objectFit:'contain'}} />}
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=> onPickLogo(e.target.files?.[0]||null)} style={{display:'none'}} />
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
              <label htmlFor="supportPhone" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الهاتف (هاتف)</span>
                <input id="supportPhone" value={form.supportPhone} onChange={e=>onChange('supportPhone', e.target.value)} placeholder="مثال: 920000000" />
                {errors.supportPhone && <small style={{color:'#dc2626'}}>{errors.supportPhone}</small>}
              </label>
              <label htmlFor="supportMobile" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الجوال (Mobile)</span>
                <input id="supportMobile" value={form.supportMobile} onChange={e=>onChange('supportMobile', e.target.value)} placeholder="مثال: +9665XXXXXXXX" />
                {errors.supportMobile && <small style={{color:'#dc2626'}}>{errors.supportMobile}</small>}
              </label>
              <label htmlFor="supportWhatsapp" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>واتساب (أرقام فقط)</span>
                <input id="supportWhatsapp" value={form.supportWhatsapp}
                  onChange={e=>onChange('supportWhatsapp', e.target.value)}
                  onBlur={e=> onChange('supportWhatsapp', e.target.value.replace(/\D+/g,''))}
                  placeholder="مثال: 9665XXXXXXXX" />
                <small style={{opacity:.7}}>سيستخدم كرابط wa.me/الرقم</small>
              </label>
              <label htmlFor="supportEmail" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>البريد الإلكتروني</span>
                <input id="supportEmail" type="email" value={form.supportEmail} onChange={e=>onChange('supportEmail', e.target.value)} placeholder="support@example.com" />
                {errors.supportEmail && <small style={{color:'#dc2626'}}>{errors.supportEmail}</small>}
              </label>
              <label htmlFor="supportHours" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>ساعات العمل (اختياري)</span>
                <input id="supportHours" value={form.supportHours} onChange={e=>onChange('supportHours', e.target.value)} placeholder="مثال: 9ص - 6م (السبت-الخميس)" />
              </label>
              <label htmlFor="taxNumber" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي (اختياري)</span>
                <input id="taxNumber" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
              </label>
            </div>
          </div>

          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>وصف الفوتر</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label htmlFor="footerAboutAr" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>نبذة (AR)</span>
                <textarea id="footerAboutAr" rows={4} value={form.footerAboutAr} onChange={e=>onChange('footerAboutAr', e.target.value)} placeholder={"متخصصون في بيع المواد الغذائية بالجملة وبالحبة\nوجميع احتياجات المنزل من منظفات و كماليات\nأيضًا يوجد لدينا قسم السوبر ماركت وجميع\nاحتياجات الأسرة السعودية وأسعارنا جملة وجودتنا\nأصلية"} />
                <small style={{opacity:.7}}>يمكنك كتابة عدة أسطر؛ ستظهر كفقرات منفصلة.</small>
              </label>
              <label htmlFor="footerAboutEn" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>About (EN)</span>
                <textarea id="footerAboutEn" rows={4} value={form.footerAboutEn} onChange={e=>onChange('footerAboutEn', e.target.value)} placeholder="We specialize in wholesale and retail food products and home essentials." />
              </label>
            </div>
          </div>

          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>روابط مهمة وتطبيقات</span>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label htmlFor="linkBlog" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط المدونة (Blog)</span>
                <input id="linkBlog" type="url" value={form.linkBlog} onChange={e=>onChange('linkBlog', e.target.value)} placeholder="https://example.com/blog" />
                {errors.linkBlog && <small style={{color:'#dc2626'}}>{errors.linkBlog}</small>}
              </label>
              <label htmlFor="linkSocial" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط التواصل الاجتماعي</span>
                <input id="linkSocial" type="url" value={form.linkSocial} onChange={e=>onChange('linkSocial', e.target.value)} placeholder="https://instagram.com/yourbrand" />
                {errors.linkSocial && <small style={{color:'#dc2626'}}>{errors.linkSocial}</small>}
              </label>
              <label htmlFor="linkReturns" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستبدال والإرجاع</span>
                <input id="linkReturns" type="url" value={form.linkReturns} onChange={e=>onChange('linkReturns', e.target.value)} placeholder="https://example.com/returns" />
                {errors.linkReturns && <small style={{color:'#dc2626'}}>{errors.linkReturns}</small>}
              </label>
              <label htmlFor="linkPrivacy" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستخدام والخصوصية</span>
                <input id="linkPrivacy" type="url" value={form.linkPrivacy} onChange={e=>onChange('linkPrivacy', e.target.value)} placeholder="https://example.com/privacy" />
                {errors.linkPrivacy && <small style={{color:'#dc2626'}}>{errors.linkPrivacy}</small>}
              </label>
              <label htmlFor="appStoreUrl" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق iOS (App Store)</span>
                <input id="appStoreUrl" type="url" value={form.appStoreUrl} onChange={e=>onChange('appStoreUrl', e.target.value)} placeholder="https://apps.apple.com/app/idXXXXXXXXX" />
                <small style={{opacity:.7}}>استخدم رابط App Store الرسمي للتطبيق.</small>
                {errors.appStoreUrl && <small style={{color:'#dc2626'}}>{errors.appStoreUrl}</small>}
              </label>
              <label htmlFor="playStoreUrl" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق Android (Google Play)</span>
                <input id="playStoreUrl" type="url" value={form.playStoreUrl} onChange={e=>onChange('playStoreUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=your.app" />
                <small style={{opacity:.7}}>استخدم رابط Google Play الرسمي للتطبيق.</small>
                {errors.playStoreUrl && <small style={{color:'#dc2626'}}>{errors.playStoreUrl}</small>}
              </label>
            </div>
          </div>

          {/* Sticky save bar */}
          <div style={{position:'sticky', bottom:0, background:'rgba(255,255,255,0.7)', backdropFilter:'saturate(180%) blur(8px)', padding:'10px 0', borderTop:'1px solid #e2e8f0', display:'flex', gap:8, alignItems:'center'}}>
            <button type="submit" disabled={saving} style={{background:'#0ea5e9', color:'#fff', border:0, padding:'8px 14px', borderRadius:8, fontWeight:700}}>
              {saving ? 'يحفظ...' : 'حفظ التغييرات'}
            </button>
            <span style={{fontSize:'.75rem', opacity:.8}}>لن يتم تطبيق الألوان على الزوار حتى تحفظ التغييرات.</span>
          </div>
        </form>
      )}
    </div>
  );
};
export default Settings;
