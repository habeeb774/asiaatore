import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';
// Lazy API import helper
const useApi = async () => (await import('../../api/client')).default;

const Settings = () => {
  const { setting, loading, error, update, uploadLogo } = useSettings();
  const [form, setForm] = useState({
    siteNameAr:'', siteNameEn:'',
    colorPrimary:'#69be3c', colorSecondary:'#2eafff', colorAccent:'#2eafff',
    taxNumber:'',
    supportPhone:'', supportMobile:'', supportWhatsapp:'', supportEmail:'', supportHours:'',
    footerAboutAr:'', footerAboutEn:'',
    linkBlog:'', linkSocial:'', linkReturns:'', linkPrivacy:'',
    appStoreUrl:'', playStoreUrl:'',
    // Company / legal
    companyNameAr:'', companyNameEn:'', commercialRegNo:'', addressAr:'', addressEn:'',
    // Homepage visuals
    heroBackgroundImage:'', heroBackgroundGradient:'', heroCenterImage:'', heroAutoplayInterval:'',
    // Top strip controls
    topStripEnabled:false, topStripAutoscroll:true, topStripBackground:'#fde68a',
    // Shipping config
    shippingBase:'', shippingPerKm:'', shippingMin:'', shippingMax:'', shippingFallback:'', originLat:'', originLng:'',
  // Payments toggles
    payPaypalEnabled:false, payStcEnabled:true, payCodEnabled:true, payBankEnabled:true,
  // Messaging
  whatsappEnabled:false,
    // Shipping providers
    aramexEnabled:false, aramexApiUrl:'', aramexApiKey:'', aramexApiUser:'', aramexApiPass:'', aramexWebhookSecret:'',
    smsaEnabled:false, smsaApiUrl:'', smsaApiKey:'', smsaWebhookSecret:''
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
        playStoreUrl: setting.playStoreUrl || '',
        // Company / legal
        companyNameAr: setting.companyNameAr || '',
        companyNameEn: setting.companyNameEn || '',
        commercialRegNo: setting.commercialRegNo || '',
        addressAr: setting.addressAr || '',
        addressEn: setting.addressEn || '',
        // Homepage visuals
        heroBackgroundImage: setting.heroBackgroundImage || '',
        heroBackgroundGradient: setting.heroBackgroundGradient || '',
        heroCenterImage: setting.heroCenterImage || '',
        heroAutoplayInterval: setting.heroAutoplayInterval ?? '',
        // Top strip
        topStripEnabled: !!setting.topStripEnabled,
        topStripAutoscroll: setting.topStripAutoscroll !== 0 && setting.topStripAutoscroll !== false,
        topStripBackground: setting.topStripBackground || '#fde68a',
        // Shipping config
        shippingBase: setting.shippingBase ?? '',
        shippingPerKm: setting.shippingPerKm ?? '',
        shippingMin: setting.shippingMin ?? '',
        shippingMax: setting.shippingMax ?? '',
        shippingFallback: setting.shippingFallback ?? '',
        originLat: setting.originLat ?? '',
        originLng: setting.originLng ?? '',
  // Payments toggles
        payPaypalEnabled: !!setting.payPaypalEnabled,
        payStcEnabled: setting.payStcEnabled !== 0 && setting.payStcEnabled !== false,
        payCodEnabled: setting.payCodEnabled !== 0 && setting.payCodEnabled !== false,
        payBankEnabled: setting.payBankEnabled !== 0 && setting.payBankEnabled !== false,
  // Messaging
  whatsappEnabled: setting.whatsappEnabled !== 0 && setting.whatsappEnabled !== false,
        // Shipping providers
        aramexEnabled: !!setting.aramexEnabled,
        aramexApiUrl: setting.aramexApiUrl || '',
        aramexApiKey: setting.aramexApiKey || '',
        aramexApiUser: setting.aramexApiUser || '',
        aramexApiPass: setting.aramexApiPass || '',
        aramexWebhookSecret: setting.aramexWebhookSecret || '',
        smsaEnabled: !!setting.smsaEnabled,
        smsaApiUrl: setting.smsaApiUrl || '',
        smsaApiKey: setting.smsaApiKey || '',
        smsaWebhookSecret: setting.smsaWebhookSecret || ''
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
    if (form.topStripBackground && !isHex(form.topStripBackground)) e.topStripBackground = 'الرجاء إدخال لون بصيغة #RRGGBB';
    if (!isEmail(form.supportEmail)) e.supportEmail = 'صيغة بريد غير صحيحة';
    if (!isUrl(form.linkBlog)) e.linkBlog = 'رابط غير صحيح';
    if (!isUrl(form.linkSocial)) e.linkSocial = 'رابط غير صحيح';
    if (!isUrl(form.linkReturns)) e.linkReturns = 'رابط غير صحيح';
    if (!isUrl(form.linkPrivacy)) e.linkPrivacy = 'رابط غير صحيح';
    if (!isUrl(form.appStoreUrl)) e.appStoreUrl = 'رابط غير صحيح';
    if (!isUrl(form.playStoreUrl)) e.playStoreUrl = 'رابط غير صحيح';
    if (!isUrl(form.heroBackgroundImage)) e.heroBackgroundImage = 'رابط غير صحيح';
    if (!isUrl(form.heroCenterImage)) e.heroCenterImage = 'رابط غير صحيح';
    if (form.heroAutoplayInterval && isNaN(+form.heroAutoplayInterval)) e.heroAutoplayInterval = 'قيمة رقمية بالمللي ثانية';
  // Shipping numeric checks
  const numOrEmpty = (v)=> v==='' || !isNaN(+v);
  if (!numOrEmpty(form.shippingBase)) e.shippingBase = 'رقم صحيح';
  if (!numOrEmpty(form.shippingPerKm)) e.shippingPerKm = 'رقم صحيح';
  if (!numOrEmpty(form.shippingMin)) e.shippingMin = 'رقم صحيح';
  if (!numOrEmpty(form.shippingMax)) e.shippingMax = 'رقم صحيح';
  if (!numOrEmpty(form.shippingFallback)) e.shippingFallback = 'رقم صحيح';
  if (!numOrEmpty(form.originLat)) e.originLat = 'رقم صحيح';
  if (!numOrEmpty(form.originLng)) e.originLng = 'رقم صحيح';
  if (form.aramexApiUrl && !isUrl(form.aramexApiUrl)) e.aramexApiUrl = 'رابط غير صحيح';
  if (form.smsaApiUrl && !isUrl(form.smsaApiUrl)) e.smsaApiUrl = 'رابط غير صحيح';
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

  // WhatsApp diagnostics
  const [waDiag, setWaDiag] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const loadWaDiag = async () => {
    setWaLoading(true);
    setMsg('');
    try {
      const api = (await import('../../api/client')).default;
      const res = await api.whatsappHealth({ suppressLog: true });
  setWaDiag(res?.health || res || null);
    } catch (e) {
      setWaDiag({ ok:false, error: e?.message || 'فشل التحميل' });
    } finally {
      setWaLoading(false);
    }
  };

  // WhatsApp send-by-order (dev/admin helper)
  const [waOrderId, setWaOrderId] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waSendResult, setWaSendResult] = useState(null);
  const sendWaForOrder = async () => {
    setWaSendResult(null);
    const id = String(waOrderId || '').trim();
    if (!id) { setWaSendResult({ ok:false, message:'يرجى إدخال رقم الطلب' }); return; }
    setWaSending(true);
    try {
      const api = (await import('../../api/client')).default;
      const res = await api.whatsappSendInvoiceByOrder(id);
      setWaSendResult(res?.result || res || { ok:true });
    } catch (e) {
      setWaSendResult({ ok:false, message: e?.data?.message || e?.message || 'فشل الإرسال' });
    } finally {
      setWaSending(false);
    }
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

  // Drawer navigation state and config
  const [navOpen, setNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('store-info');
  const sections = [
    { id: 'store-info', label: 'معلومات المتجر' },
    { id: 'brand-colors', label: 'الألوان' },
    { id: 'logo-preview', label: 'الشعار' },
    { id: 'contact-info', label: 'معلومات التواصل' },
    { id: 'company-footer', label: 'بيانات الشركة والفوتر' },
    { id: 'top-strip', label: 'الشريط العلوي' },
    { id: 'hero', label: 'بطل الصفحة الرئيسية' },
    { id: 'whatsapp', label: 'الرسائل عبر واتساب' },
    { id: 'env-db', label: 'البيئة والاتصال بقاعدة البيانات' },
    { id: 'shipping-payment', label: 'الشحن والدفع' },
    { id: 'shipping-providers', label: 'مزودو الشحن' },
    { id: 'links-apps', label: 'روابط مهمة وتطبيقات' }
  ];
  const goTo = (id) => {
    setCurrentSection(id);
    setNavOpen(false);
    // Optional smooth scroll if needed
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }, 50);
  };

  return (
    <div className="admin-page-wrapper">
      <Seo title="الإعدادات | Settings" description="Store settings" />
      <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'space-between'}}>
        <h1 className="page-title" style={{margin:0}}>الإعدادات / Settings</h1>
        <button type="button" className="ui-btn ui-btn--soft ui-btn--sm" onClick={()=> setNavOpen(true)}>
          قائمة الأقسام
        </button>
      </div>
      {/* Drawer */}
      {navOpen && (
        <>
          <div onClick={()=> setNavOpen(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:50}} />
          <aside role="dialog" aria-label="قائمة الأقسام" style={{position:'fixed', insetBlockStart:0, insetInlineEnd:0, blockSize:'100dvh', inlineSize:'min(80vw, 320px)', background:'#fff', borderInlineStart:'1px solid #e2e8f0', zIndex:60, display:'grid', gridTemplateRows:'auto 1fr', boxShadow:'-12px 0 24px -16px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBlockEnd:'1px solid #e2e8f0'}}>
              <strong>أقسام الإعدادات</strong>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={()=> setNavOpen(false)}>إغلاق</button>
            </div>
            <nav style={{padding:8, overflow:'auto'}}>
              <ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:6}}>
                {sections.map(s => (
                  <li key={s.id}>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" style={{width:'100%', justifyContent:'flex-start'}} onClick={()=> goTo(s.id)}>
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </>
      )}
      <div aria-live="polite" style={{minHeight:24, marginBottom:8, color: msg?.startsWith('فشل') ? '#dc2626' : '#0f766e'}}>{msg}</div>
      {loading ? (
        <p>يتم التحميل...</p>
      ) : error ? (
        <p className="error">خطأ: {error}</p>
      ) : (
        <form onSubmit={submit} className="settings-form" style={{display:'grid', gap:12, maxWidth:880}}>
          <section id="store-info" style={{scrollMarginTop:80}} hidden={currentSection !== 'store-info'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>معلومات المتجر</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
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
          </section>

          <section id="brand-colors" style={{scrollMarginTop:80}} hidden={currentSection !== 'brand-colors'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>ألوان الهوية</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-3)', gap:8}}>
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
          </section>

          <section id="logo-preview" style={{scrollMarginTop:80}} hidden={currentSection !== 'logo-preview'}>
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
          </section>

          <section id="contact-info" style={{scrollMarginTop:80}} hidden={currentSection !== 'contact-info'}>
          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>معلومات التواصل</span>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
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
          </section>

          <section id="company-footer" style={{display:'grid', gap:12, scrollMarginTop:80}} hidden={currentSection !== 'company-footer'}>
            <div style={{display:'grid', gap:8}}>
              <span style={{fontSize:'.8rem', fontWeight:800}}>وصف الفوتر</span>
              <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
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

            <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
              <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>بيانات الشركة والفواتير</legend>
              <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
                <label htmlFor="companyNameAr" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>اسم الشركة (AR)</span>
                  <input id="companyNameAr" value={form.companyNameAr} onChange={e=>onChange('companyNameAr', e.target.value)} placeholder="مثال: شركة منفذ آسيا التجارية" />
                </label>
                <label htmlFor="companyNameEn" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>Company Name (EN)</span>
                  <input id="companyNameEn" value={form.companyNameEn} onChange={e=>onChange('companyNameEn', e.target.value)} placeholder="e.g., Asia Outlet Co." />
                </label>
                <label htmlFor="commercialRegNo" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>السجل التجاري</span>
                  <input id="commercialRegNo" value={form.commercialRegNo} onChange={e=>onChange('commercialRegNo', e.target.value)} placeholder="مثال: 1010xxxxxx" />
                </label>
                <label htmlFor="taxNumber2" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي</span>
                  <input id="taxNumber2" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
                </label>
                <label htmlFor="addressAr" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>العنوان (AR)</span>
                  <textarea id="addressAr" rows={2} value={form.addressAr} onChange={e=>onChange('addressAr', e.target.value)} placeholder="الرياض - حي ... شارع ..." />
                </label>
                <label htmlFor="addressEn" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>Address (EN)</span>
                  <textarea id="addressEn" rows={2} value={form.addressEn} onChange={e=>onChange('addressEn', e.target.value)} placeholder="Riyadh, District..., Street..." />
                </label>
              </div>
            </fieldset>
          </section>

          <section id="top-strip" style={{scrollMarginTop:80}} hidden={currentSection !== 'top-strip'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الشريط العلوي (Top Strip)</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8, alignItems:'center'}}>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.topStripEnabled} onChange={e=>onChange('topStripEnabled', e.target.checked)} />
                <span style={{fontSize:'.8rem', fontWeight:700}}>تفعيل الشريط العلوي</span>
              </label>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.topStripAutoscroll} onChange={e=>onChange('topStripAutoscroll', e.target.checked)} />
                <span style={{fontSize:'.8rem', fontWeight:700}}>تحريك تلقائي</span>
              </label>
              <label htmlFor="topStripBackground" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>لون الخلفية</span>
                <input id="topStripBackground" type="color" value={form.topStripBackground} onChange={e=>onChange('topStripBackground', e.target.value)} />
                <input aria-label="Hex" value={form.topStripBackground} onChange={e=>onChange('topStripBackground', e.target.value)} />
                {errors.topStripBackground && <small style={{color:'#dc2626'}}>{errors.topStripBackground}</small>}
              </label>
              <div style={{fontSize:'.65rem', opacity:.7}}>محتوى الشريط العلوي يُدار من قسم التسويق (بانرات الموقع - موقع topStrip).</div>
            </div>
          </fieldset>
          </section>

          <section id="hero" style={{scrollMarginTop:80}} hidden={currentSection !== 'hero'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>بطل الصفحة الرئيسية (Hero)</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
              <label htmlFor="heroBackgroundImage" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>صورة الخلفية (رابط)</span>
                <input id="heroBackgroundImage" type="url" value={form.heroBackgroundImage} onChange={e=>onChange('heroBackgroundImage', e.target.value)} placeholder="https://.../hero.jpg" />
                {errors.heroBackgroundImage && <small style={{color:'#dc2626'}}>{errors.heroBackgroundImage}</small>}
              </label>
              <label htmlFor="heroCenterImage" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>صورة وسطية (اختياري - رابط)</span>
                <input id="heroCenterImage" type="url" value={form.heroCenterImage} onChange={e=>onChange('heroCenterImage', e.target.value)} placeholder="https://.../center.webp" />
                {errors.heroCenterImage && <small style={{color:'#dc2626'}}>{errors.heroCenterImage}</small>}
              </label>
              <label htmlFor="heroBackgroundGradient" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>تدرّج التعتيم (CSS)</span>
                <input id="heroBackgroundGradient" value={form.heroBackgroundGradient} onChange={e=>onChange('heroBackgroundGradient', e.target.value)} placeholder="linear-gradient(135deg, rgba(16,185,129,0.6), rgba(5,150,105,0.6))" />
              </label>
              <label htmlFor="heroAutoplayInterval" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الانتقال التلقائي (مللي ثانية)</span>
                <input id="heroAutoplayInterval" type="number" min="1000" step="500" value={form.heroAutoplayInterval} onChange={e=>onChange('heroAutoplayInterval', e.target.value)} placeholder="5000" />
                {errors.heroAutoplayInterval && <small style={{color:'#dc2626'}}>{errors.heroAutoplayInterval}</small>}
              </label>
            </div>
          </fieldset>
          </section>

          <section id="whatsapp" style={{scrollMarginTop:80}} hidden={currentSection !== 'whatsapp'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الرسائل عبر واتساب</legend>
            <div style={{display:'grid', gap:8}}>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.whatsappEnabled} onChange={e=>onChange('whatsappEnabled', e.target.checked)} />
                <span style={{fontWeight:700}}>تفعيل إرسال الفاتورة عبر واتساب</span>
              </label>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button type="button" onClick={loadWaDiag} className="btn-secondary" disabled={waLoading}>{waLoading ? 'يفحص...' : 'تشخيص الإعداد'}</button>
                {waDiag && (
                  <div className="text-xs" style={{display:'grid', gap:4}}>
                    <div>المزوّد: <strong>{waDiag.provider || '—'}</strong></div>
                    <div>جاهزية التهيئة: <strong style={{color: ((waDiag.configured && waDiag.enabled) ? '#065f46' : '#991b1b')}}>{(waDiag.configured && waDiag.enabled) ? 'جاهز' : 'غير مكتمل'}</strong></div>
                    {(waDiag.meta || waDiag.twilio) && (
                      <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(120px,1fr))', gap:6}}>
                        {Object.entries(waDiag.meta || waDiag.twilio).map(([k,v]) => (
                          <div key={k} className="text-[11px]" style={{opacity:.85}}>
                            <span style={{fontWeight:700}}>{k}</span>: <span style={{color: v ? '#065f46' : '#991b1b'}}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {waDiag.error && <div className="text-[11px] text-red-700">خطأ: {waDiag.error}</div>}
                  </div>
                )}
              </div>
              <div style={{display:'grid', gap:6, borderTop:'1px dashed #e2e8f0', paddingTop:8}}>
                <label htmlFor="waOrderId" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>اختبار: إرسال فاتورة طلب عبر واتساب (أدخل رقم الطلب)</span>
                  <div style={{display:'grid', gridTemplateColumns:'minmax(140px, 220px) auto', gap:8, alignItems:'center'}}>
                    <input id="waOrderId" value={waOrderId} onChange={e=>setWaOrderId(e.target.value)} placeholder="مثال: ord_123..." />
                    <button type="button" onClick={sendWaForOrder} disabled={waSending || !waOrderId} className="ui-btn ui-btn--sm" style={{background:'#16a34a', color:'#fff'}}>
                      {waSending ? 'يرسل...' : 'إرسال عبر واتساب'}
                    </button>
                  </div>
                </label>
                {waSendResult && (
                  <div className="text-[12px]" style={{color: waSendResult.ok !== false ? '#065f46' : '#991b1b'}}>
                    {waSendResult.ok !== false ? 'تم الإرسال (تحقق من سجل الإرسال/الويب هوك).' : `فشل الإرسال: ${waSendResult.message || 'غير معروف'}`}
                  </div>
                )}
                <small style={{opacity:.7}}>ملاحظة: يتطلب ذلك صلاحية الأدمن وتهيئة مزود واتساب بنجاح. للاختبار المحلي، فعّل رؤوس التطوير ALLOW_DEV_HEADERS.</small>
              </div>
              <small style={{opacity:.7}}>يتطلب ضبط متغيرات البيئة الخاصة بالمزوّد (Twilio أو Meta). هذا الخيار يتيح/يعطّل الإرسال من السيرفر.</small>
            </div>
          </fieldset>
          </section>

          {/* Env & DB */}
          <section id="env-db" style={{scrollMarginTop:80}} hidden={currentSection !== 'env-db'}>
            <fieldset style={{display:'grid', gap:12, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
              <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>إعدادات البيئة والاتصال بقاعدة البيانات</legend>
              <EnvEditor />
            </fieldset>
          </section>

          <section id="shipping-payment" style={{scrollMarginTop:80}} hidden={currentSection !== 'shipping-payment'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الشحن والدفع</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-3)', gap:8}}>
              <label htmlFor="shippingBase" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رسوم أساسية (SAR)</span>
                <input id="shippingBase" type="number" step="0.01" value={form.shippingBase} onChange={e=>onChange('shippingBase', e.target.value)} placeholder="مثال: 10" />
                {errors.shippingBase && <small style={{color:'#dc2626'}}>{errors.shippingBase}</small>}
              </label>
              <label htmlFor="shippingPerKm" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>لكل كم (SAR/km)</span>
                <input id="shippingPerKm" type="number" step="0.01" value={form.shippingPerKm} onChange={e=>onChange('shippingPerKm', e.target.value)} placeholder="0.7" />
                {errors.shippingPerKm && <small style={{color:'#dc2626'}}>{errors.shippingPerKm}</small>}
              </label>
              <label htmlFor="shippingMin" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الحد الأدنى</span>
                <input id="shippingMin" type="number" step="0.01" value={form.shippingMin} onChange={e=>onChange('shippingMin', e.target.value)} placeholder="15" />
                {errors.shippingMin && <small style={{color:'#dc2626'}}>{errors.shippingMin}</small>}
              </label>
              <label htmlFor="shippingMax" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الحد الأقصى</span>
                <input id="shippingMax" type="number" step="0.01" value={form.shippingMax} onChange={e=>onChange('shippingMax', e.target.value)} placeholder="60" />
                {errors.shippingMax && <small style={{color:'#dc2626'}}>{errors.shippingMax}</small>}
              </label>
              <label htmlFor="shippingFallback" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>تعرفة احتياطية</span>
                <input id="shippingFallback" type="number" step="0.01" value={form.shippingFallback} onChange={e=>onChange('shippingFallback', e.target.value)} placeholder="25" />
                {errors.shippingFallback && <small style={{color:'#dc2626'}}>{errors.shippingFallback}</small>}
              </label>
              <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
                <label htmlFor="originLat" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>إحداثي المتجر (Lat)</span>
                  <input id="originLat" type="number" step="0.0001" value={form.originLat} onChange={e=>onChange('originLat', e.target.value)} placeholder="24.7136" />
                  {errors.originLat && <small style={{color:'#dc2626'}}>{errors.originLat}</small>}
                </label>
                <label htmlFor="originLng" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>إحداثي المتجر (Lng)</span>
                  <input id="originLng" type="number" step="0.0001" value={form.originLng} onChange={e=>onChange('originLng', e.target.value)} placeholder="46.6753" />
                  {errors.originLng && <small style={{color:'#dc2626'}}>{errors.originLng}</small>}
                </label>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-4-min)', gap:8, marginTop:8}}>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.payPaypalEnabled} onChange={e=>onChange('payPaypalEnabled', e.target.checked)} /> PayPal
              </label>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.payStcEnabled} onChange={e=>onChange('payStcEnabled', e.target.checked)} /> STC Pay
              </label>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.payCodEnabled} onChange={e=>onChange('payCodEnabled', e.target.checked)} /> الدفع عند الاستلام
              </label>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="checkbox" checked={!!form.payBankEnabled} onChange={e=>onChange('payBankEnabled', e.target.checked)} /> التحويل البنكي
              </label>
            </div>
          </fieldset>
          </section>

          <section id="shipping-providers" style={{scrollMarginTop:80}} hidden={currentSection !== 'shipping-providers'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>مزودو الشحن (Aramex / SMSA)</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:12}}>
              <div style={{display:'grid', gap:8, alignContent:'start'}}>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input id="aramexEnabled" type="checkbox" checked={!!form.aramexEnabled} onChange={e=>onChange('aramexEnabled', e.target.checked)} />
                  <label htmlFor="aramexEnabled" style={{fontWeight:700}}>تفعيل Aramex</label>
                </div>
                <label htmlFor="aramexApiUrl" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>Aramex API URL</span>
                  <input id="aramexApiUrl" type="url" value={form.aramexApiUrl} onChange={e=>onChange('aramexApiUrl', e.target.value)} placeholder="https://api.aramex.com/..." />
                  {errors.aramexApiUrl && <small style={{color:'#dc2626'}}>{errors.aramexApiUrl}</small>}
                </label>
                <label htmlFor="aramexApiKey" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>API Key</span>
                  <input id="aramexApiKey" value={form.aramexApiKey} onChange={e=>onChange('aramexApiKey', e.target.value)} placeholder="••••••" />
                </label>
                <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
                  <label htmlFor="aramexApiUser" style={{display:'grid', gap:4}}>
                    <span style={{fontSize:'.7rem', fontWeight:700}}>Username</span>
                    <input id="aramexApiUser" value={form.aramexApiUser} onChange={e=>onChange('aramexApiUser', e.target.value)} placeholder="user" />
                  </label>
                  <label htmlFor="aramexApiPass" style={{display:'grid', gap:4}}>
                    <span style={{fontSize:'.7rem', fontWeight:700}}>Password</span>
                    <input id="aramexApiPass" type="password" value={form.aramexApiPass} onChange={e=>onChange('aramexApiPass', e.target.value)} placeholder="••••••" />
                  </label>
                </div>
                <label htmlFor="aramexWebhookSecret" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>Webhook Secret (توقيع)</span>
                  <input id="aramexWebhookSecret" value={form.aramexWebhookSecret} onChange={e=>onChange('aramexWebhookSecret', e.target.value)} placeholder="secret" />
                </label>
              </div>
              <div style={{display:'grid', gap:8, alignContent:'start'}}>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input id="smsaEnabled" type="checkbox" checked={!!form.smsaEnabled} onChange={e=>onChange('smsaEnabled', e.target.checked)} />
                  <label htmlFor="smsaEnabled" style={{fontWeight:700}}>تفعيل SMSA</label>
                </div>
                <label htmlFor="smsaApiUrl" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>SMSA API URL</span>
                  <input id="smsaApiUrl" type="url" value={form.smsaApiUrl} onChange={e=>onChange('smsaApiUrl', e.target.value)} placeholder="https://api.smsaexpress.com/..." />
                  {errors.smsaApiUrl && <small style={{color:'#dc2626'}}>{errors.smsaApiUrl}</small>}
                </label>
                <label htmlFor="smsaApiKey" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>API Key</span>
                  <input id="smsaApiKey" value={form.smsaApiKey} onChange={e=>onChange('smsaApiKey', e.target.value)} placeholder="••••••" />
                </label>
                <label htmlFor="smsaWebhookSecret" style={{display:'grid', gap:4}}>
                  <span style={{fontSize:'.7rem', fontWeight:700}}>Webhook Secret (توقيع)</span>
                  <input id="smsaWebhookSecret" value={form.smsaWebhookSecret} onChange={e=>onChange('smsaWebhookSecret', e.target.value)} placeholder="secret" />
                </label>
              </div>
            </div>
            <small style={{opacity:.7}}>عند التفعيل، سيقرأ السيرفر هذه القيم من قاعدة البيانات بدلاً من متغيرات البيئة. تأكد من إعداد مسارات الويب هوك المناسبة لكل مزود.</small>
          </fieldset>
          </section>

          <section id="links-apps" style={{scrollMarginTop:80}} hidden={currentSection !== 'links-apps'}>
            <div style={{display:'grid', gap:8}}>
              <span style={{fontSize:'.8rem', fontWeight:800}}>روابط مهمة وتطبيقات</span>
              <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
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
          </section>

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

// Inline sub-component: Env & DB editor (admin)
function EnvEditor() {
  const [loading, setLoading] = useState(true);
  const [savingClient, setSavingClient] = useState(false);
  const [savingServer, setSavingServer] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');
  const [files, setFiles] = useState({ serverEnv: '', clientEnv: '' });
  const [prod, setProd] = useState(false);
  // Client env
  const [viteProxyTarget, setViteProxyTarget] = useState('');
  const [viteApiUrl, setViteApiUrl] = useState('');
  const [viteTimeout, setViteTimeout] = useState('');
  // Server env
  const [dbUrl, setDbUrl] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [dbName, setDbName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const api = await useApi();
        const res = await api.envGet();
        setFiles(res?.files || {});
        setProd(!!res?.prod);
        const client = res?.env?.client || {};
        const server = res?.env?.server || {};
        setViteProxyTarget(client.VITE_PROXY_TARGET || '');
        setViteApiUrl(client.VITE_API_URL || '');
        setViteTimeout(client.VITE_API_TIMEOUT_MS || '');
        setDbUrl(server.DATABASE_URL || '');
        setDbHost(server.DB_HOST || '');
        setDbPort(server.DB_PORT || '3306');
        setDbUser(server.DB_USER || '');
        // DB_PASS may be masked; we keep empty so we don't overwrite unless filled
        setDbPass('');
        setDbName(server.DB_NAME || '');
      } catch (e) {
        const is404 = e?.status === 404 || /\(GET \/env\)/.test(String(e?.message||''));
        const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
        setMsg('فشل تحميل متغيرات البيئة: ' + (e?.data?.message || e?.message || '') + hint);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dbUrlFromParts = useMemo(() => {
    if (!dbHost || !dbUser || !dbName) return '';
    const p = dbPort || '3306';
    const pass = dbPass ? `:${encodeURIComponent(dbPass)}` : '';
    return `mysql://${encodeURIComponent(dbUser)}${pass}@${dbHost}:${p}/${dbName}`;
  }, [dbHost, dbPort, dbUser, dbPass, dbName]);

  const onSaveClient = async () => {
    setSavingClient(true); setMsg('');
    try {
      const api = await useApi();
      const entries = {};
      if (viteProxyTarget !== undefined) entries.VITE_PROXY_TARGET = viteProxyTarget;
      if (viteApiUrl !== undefined) entries.VITE_API_URL = viteApiUrl;
      if (viteTimeout !== undefined) entries.VITE_API_TIMEOUT_MS = String(viteTimeout || '');
      const res = await api.envUpdate('client', entries);
      setMsg(`تم حفظ إعدادات الواجهة (${res.updatedKeys.length} مفتاح) في ${res.file}`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(PATCH \/env\)/.test(String(e?.message||''));
      const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل حفظ إعدادات الواجهة: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setSavingClient(false); }
  };

  const onTestDb = async () => {
    setTesting(true); setMsg('');
    try {
      const api = await useApi();
      const payload = dbUrl ? { databaseUrl: dbUrl } : { host: dbHost, port: dbPort, user: dbUser, pass: dbPass, name: dbName };
      const res = await api.envDbTest(payload);
      setMsg(`نجح الاتصال بقاعدة البيانات. الإصدار: ${res.version || 'غير معروف'}`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(POST \/env\/db\/test\)/.test(String(e?.message||''));
      const hint = is404 ? ' — مسار /api/env/db/test غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل اختبار الاتصال بقاعدة البيانات: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setTesting(false); }
  };

  const onSaveServer = async () => {
    setSavingServer(true); setMsg('');
    try {
      const api = await useApi();
      const entries = {};
      if (dbUrl) {
        entries.DATABASE_URL = dbUrl;
      } else {
        if (dbHost !== undefined) entries.DB_HOST = dbHost;
        if (dbPort !== undefined) entries.DB_PORT = String(dbPort || '3306');
        if (dbUser !== undefined) entries.DB_USER = dbUser;
        if (dbPass) entries.DB_PASS = dbPass; // only send if provided (to avoid overwriting masked secret)
        if (dbName !== undefined) entries.DB_NAME = dbName;
      }
      const res = await api.envUpdate('server', entries);
      setMsg(`تم حفظ إعدادات الخادم (${res.updatedKeys.length} مفتاح) في ${res.file}. قد يتطلب الأمر إعادة تشغيل الخادم ليتم تطبيق التغييرات.`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(PATCH \/env\)/.test(String(e?.message||''));
      const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل حفظ إعدادات الخادم: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setSavingServer(false); }
  };

  if (loading) return <div>يتم تحميل متغيرات البيئة...</div>;

  return (
    <div style={{display:'grid', gap:16}}>
      <div className="text-xs" style={{opacity:.75}}>
        <div>ملفات البيئة:</div>
        <div>الخادم: <code>{files.serverEnv || 'غير محدد'}</code></div>
        <div>الواجهة: <code>{files.clientEnv || 'غير محدد'}</code></div>
        {prod && <div style={{color:'#991b1b'}}>تنبيه: وضع الإنتاج — قد يتم تعطيل تعديل البيئة.</div>}
      </div>

      {/* Client env */}
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:700, fontSize:'.8rem'}}>بيئة الواجهة (Vite)</legend>
        <div style={{display:'grid', gap:8}}>
          <label htmlFor="viteProxyTarget" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_PROXY_TARGET</span>
            <input id="viteProxyTarget" value={viteProxyTarget} onChange={e=>setViteProxyTarget(e.target.value)} placeholder="http://localhost:8842" />
          </label>
          <label htmlFor="viteApiUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_API_URL (اختياري)</span>
            <input id="viteApiUrl" value={viteApiUrl} onChange={e=>setViteApiUrl(e.target.value)} placeholder="http://localhost:8842/api" />
          </label>
          <label htmlFor="viteTimeout" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_API_TIMEOUT_MS (اختياري)</span>
            <input id="viteTimeout" value={viteTimeout} onChange={e=>setViteTimeout(e.target.value)} placeholder="12000" />
          </label>
          <div style={{display:'flex', gap:8}}>
            <button type="button" onClick={onSaveClient} disabled={savingClient} className="ui-btn" style={{background:'#0ea5e9', color:'#fff'}}>
              {savingClient ? 'يحفظ...' : 'حفظ بيئة الواجهة'}
            </button>
          </div>
        </div>
      </fieldset>

      {/* Server env (DB) */}
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:700, fontSize:'.8rem'}}>بيئة الخادم (قاعدة البيانات)</legend>
        <div style={{display:'grid', gap:8}}>
          <label htmlFor="dbUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>DATABASE_URL (بديل عن القيم التفصيلية)</span>
            <input id="dbUrl" value={dbUrl} onChange={e=>setDbUrl(e.target.value)} placeholder="mysql://user:pass@host:3306/dbname" />
          </label>
          <div className="text-xs" style={{opacity:.7}}>أو أدخل القيم التفصيلية أدناه (إذا تم تحديد DATABASE_URL سيتم تجاهل هذه القيم عند الحفظ).</div>
          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label htmlFor="dbHost" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_HOST</span>
              <input id="dbHost" value={dbHost} onChange={e=>setDbHost(e.target.value)} placeholder="localhost أو عنوان السيرفر" />
            </label>
            <label htmlFor="dbPort" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_PORT</span>
              <input id="dbPort" value={dbPort} onChange={e=>setDbPort(e.target.value)} placeholder="3306" />
            </label>
            <label htmlFor="dbUser" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_USER</span>
              <input id="dbUser" value={dbUser} onChange={e=>setDbUser(e.target.value)} placeholder="root أو اسم المستخدم" />
            </label>
            <label htmlFor="dbPass" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_PASS</span>
              <input id="dbPass" type="password" value={dbPass} onChange={e=>setDbPass(e.target.value)} placeholder="•••••• (اتركه فارغاً لعدم التغيير)" />
            </label>
            <label htmlFor="dbName" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_NAME</span>
              <input id="dbName" value={dbName} onChange={e=>setDbName(e.target.value)} placeholder="اسم قاعدة البيانات" />
            </label>
          </div>
          <div className="text-xs" style={{opacity:.75}}>معاينة سلسلة الاتصال المبنية من القيم التفصيلية:</div>
          <div style={{fontFamily:'monospace', fontSize:12, background:'#f8fafc', padding:'6px 8px', borderRadius:6, direction:'ltr'}}>
            {dbUrlFromParts || '(أدخل القيم لعرض المعاينة)'}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button type="button" onClick={onTestDb} disabled={testing} className="ui-btn" style={{background:'#16a34a', color:'#fff'}}>
              {testing ? 'يفحص...' : 'اختبار الاتصال'}
            </button>
            <button type="button" onClick={onSaveServer} disabled={savingServer} className="ui-btn" style={{background:'#0ea5e9', color:'#fff'}}>
              {savingServer ? 'يحفظ...' : 'حفظ إعدادات الخادم'}
            </button>
          </div>
        </div>
      </fieldset>

      <div aria-live="polite" className="text-xs" style={{color: msg?.startsWith('فشل') ? '#991b1b' : '#065f46'}}>{msg}</div>
      <small style={{opacity:.7}}>ملاحظة: قد تحتاج لإعادة تشغيل خادم API وتحديث واجهة Vite حتى تُطبق التغييرات.</small>
    </div>
  );
}
