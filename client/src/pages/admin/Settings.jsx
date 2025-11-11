import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import AdminLayout from '../../components/features/admin/AdminLayout';
import { useSettings } from '../../stores/SettingsContext';
import { Button } from '../../components/ui';
import Input from '../../components/ui/input';
import EnvEditor from './EnvEditor';
import SettingsUi from './SettingsUi';
import SettingsLogo from './SettingsLogo';
import SettingsWhatsapp from './SettingsWhatsapp';
import SettingsShippingPayment from './SettingsShippingPayment';
import SettingsShippingProviders from './SettingsShippingProviders';
import SettingsLinksApps from './SettingsLinksApps';
import SettingsCompanyFooter from './SettingsCompanyFooter';
import SettingsTopStrip from './SettingsTopStrip';
import SettingsHero from './SettingsHero';

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
  ,
  // UI component controls
    ui_sidebar_hover_preview: false,
    ui_sidebar_collapsed_default: false,
    ui_button_radius: '8',
    ui_button_shadow: true,
    ui_input_radius: '6',
    ui_font_family: 'Cairo',
    ui_base_font_size: '16',
    ui_spacing_scale: '1',
    ui_theme_default: 'system'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const importInputRef = useRef(null);
  const importSaveInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
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
      ,
      // UI component controls (optional)
      ui_sidebar_hover_preview: setting.ui_sidebar_hover_preview === true || setting.ui_sidebar_hover_preview === 'true' || false,
      ui_sidebar_collapsed_default: setting.ui_sidebar_collapsed_default === true || setting.ui_sidebar_collapsed_default === 'true' || false,
      ui_button_radius: setting.ui_button_radius ? String(setting.ui_button_radius) : '8',
      ui_button_shadow: setting.ui_button_shadow === false ? false : (setting.ui_button_shadow === true || setting.ui_button_shadow === 'true' || true),
      ui_input_radius: setting.ui_input_radius ? String(setting.ui_input_radius) : '6',
      ui_font_family: setting.ui_font_family || 'Cairo',
      ui_base_font_size: setting.ui_base_font_size ? String(setting.ui_base_font_size) : '16',
      ui_spacing_scale: setting.ui_spacing_scale ? String(setting.ui_spacing_scale) : '1',
      ui_theme_default: setting.ui_theme_default || 'system'
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
      // UI variables
      root.style.setProperty('--ui-border-radius', `${form.ui_button_radius || '8'}px`);
      root.style.setProperty('--ui-button-radius', `${form.ui_button_radius || '8'}px`);
      root.style.setProperty('--ui-input-radius', `${form.ui_input_radius || '6'}px`);
      root.style.setProperty('--ui-font-family', form.ui_font_family || 'Cairo');
      root.style.setProperty('--ui-base-font-size', `${form.ui_base_font_size || '16'}px`);
      root.style.setProperty('--ui-spacing-scale', `${form.ui_spacing_scale || '1'}`);
      // Button shadow toggle
      if (form.ui_button_shadow === false || form.ui_button_shadow === 'false') root.style.setProperty('--ui-button-shadow', 'none');
      else root.style.setProperty('--ui-button-shadow', '0 6px 18px rgba(2,6,23,0.12)');
      // Sidebar preview mode
      if (form.ui_sidebar_hover_preview) root.classList.add('sb-hover-preview-enabled'); else root.classList.remove('sb-hover-preview-enabled');
      // Theme default class (preview only)
      if (form.ui_theme_default === 'dark') root.classList.add('dark');
      else if (form.ui_theme_default === 'light') root.classList.remove('dark');
      setMsg('تم تطبيق الألوان على المعاينة');
    } catch {}
  };

  const resetPreviewFromSetting = () => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', setting?.colorPrimary || '#69be3c');
      root.style.setProperty('--color-secondary', setting?.colorSecondary || '#2eafff');
      root.style.setProperty('--color-accent', setting?.colorAccent || '#2eafff');
      // Reset UI variables from saved settings or defaults
      root.style.setProperty('--ui-border-radius', `${setting?.ui_button_radius || '8'}px`);
      root.style.setProperty('--ui-button-radius', `${setting?.ui_button_radius || '8'}px`);
      root.style.setProperty('--ui-input-radius', `${setting?.ui_input_radius || '6'}px`);
      root.style.setProperty('--ui-font-family', setting?.ui_font_family || 'Cairo');
      root.style.setProperty('--ui-base-font-size', `${setting?.ui_base_font_size || '16'}px`);
      root.style.setProperty('--ui-spacing-scale', `${setting?.ui_spacing_scale || '1'}`);
      if (setting?.ui_button_shadow === false || setting?.ui_button_shadow === 'false') root.style.setProperty('--ui-button-shadow', 'none');
      else root.style.setProperty('--ui-button-shadow', '0 6px 18px rgba(2,6,23,0.12)');
      if (setting?.ui_sidebar_hover_preview) root.classList.add('sb-hover-preview-enabled'); else root.classList.remove('sb-hover-preview-enabled');
      if (setting?.ui_theme_default === 'dark') root.classList.add('dark');
      else if (setting?.ui_theme_default === 'light') root.classList.remove('dark');
      setMsg('تمت إعادة الألوان إلى القيم الحالية');
    } catch {}
  };

  // Import / Export helpers for theme JSON
  const exportSettings = () => {
    try {
      // Only export keys that exist in form
      const payload = {};
      Object.keys(form).forEach(k => { payload[k] = form[k]; });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-settings-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('تم تنزيل ملف الإعدادات');
    } catch (e) {
      setMsg('فشل تصدير الإعدادات: ' + (e?.message || 'خطأ غير معروف'));
    }
  };

  const onImportFileChange = async (file) => {
    if (!file) return;
    setMsg('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) throw new Error('ملف غير صالح');
      // Only keep keys that exist in our form
      const allowed = Object.keys(form);
      const picked = {};
      Object.keys(parsed).forEach(k => { if (allowed.includes(k)) picked[k] = parsed[k]; });
      if (Object.keys(picked).length === 0) {
        setMsg('لم يتم العثور على مفاتيح صالحة في الملف المستورد');
        return;
      }
      setForm(f => ({ ...f, ...picked }));
      // apply preview automatically for imported values
      setTimeout(() => applyPreviewToApp(), 30);
      setMsg('تم استيراد القيم إلى النموذج. تحقق ثم انقر حفظ لتطبيقها نهائياً.');
    } catch (e) {
      setMsg('فشل استيراد الملف: ' + (e?.message || 'خطأ أثناء القراءة'));
    } finally {
      // reset input so same file can be re-selected if needed
      try { importInputRef.current.value = ''; } catch {}
    }
  };

  const triggerImportClick = () => importInputRef.current?.click();

  // Import and save in one step (with confirmation)
  const importAndSave = async (file) => {
    if (!file) return;
    // confirmation to avoid accidental overwrite
    if (!confirm('سيتم استيراد القيم من الملف وحفظها مباشرة في إعدادات المتجر. هل تريد المتابعة؟')) return;
    setImporting(true); setMsg('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) throw new Error('ملف غير صالح');
      const allowed = Object.keys(form);
      const picked = {};
      Object.keys(parsed).forEach(k => { if (allowed.includes(k)) picked[k] = parsed[k]; });
      if (Object.keys(picked).length === 0) {
        setMsg('لم يتم العثور على مفاتيح صالحة في الملف المستورد');
        return;
      }
      // apply preview locally first
      setForm(f => ({ ...f, ...picked }));
      setTimeout(() => applyPreviewToApp(), 30);
      // then persist the picked keys
      await update(picked);
      setMsg('تم استيراد وحفظ الإعدادات بنجاح');
    } catch (e) {
      const details = e?.data?.message || e?.message || String(e);
      setMsg('فشل الاستيراد والحفظ: ' + details);
    } finally {
      setImporting(false);
      try { importInputRef.current.value = ''; } catch {}
    }
  };

  // WhatsApp diagnostics
  const [waDiag, setWaDiag] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const loadWaDiag = async () => {
    setWaLoading(true);
    setMsg('');
    try {
      const api = (await import('../../services/api/client')).default;
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
      const api = (await import('../../services/api/client')).default;
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
  { id: 'ui-components', label: 'مظهر الواجهة' },
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
    <AdminLayout title="الإعدادات / Settings">
      <Seo title="الإعدادات | Settings" description="Store settings" />
      <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'space-between'}}>
        <div style={{margin:0}} />
        <Button type="button" variant="secondary" size="sm" onClick={()=> setNavOpen(true)}>
          قائمة الأقسام
        </Button>
      </div>
      {/* Drawer */}
      {navOpen && (
        <>
          <div onClick={()=> setNavOpen(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:50}} />
          <aside role="dialog" aria-label="قائمة الأقسام" style={{position:'fixed', insetBlockStart:0, insetInlineEnd:0, blockSize:'100dvh', inlineSize:'min(80vw, 320px)', background:'#fff', borderInlineStart:'1px solid #e2e8f0', zIndex:60, display:'grid', gridTemplateRows:'auto 1fr', boxShadow:'-12px 0 24px -16px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBlockEnd:'1px solid #e2e8f0'}}>
              <strong>أقسام الإعدادات</strong>
              <Button type="button" variant="ghost" size="sm" onClick={()=> setNavOpen(false)}>إغلاق</Button>
            </div>
            <nav style={{padding:8, overflow:'auto'}}>
              <ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:6}}>
                {sections.map(s => (
                  <li key={s.id}>
                    <Button type="button" variant="ghost" size="sm" style={{width:'100%', justifyContent:'flex-start'}} onClick={()=> goTo(s.id)}>
                      {s.label}
                    </Button>
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
          <Input id="siteNameAr" value={form.siteNameAr} onChange={e=>onChange('siteNameAr', e.target.value)} placeholder="مثال: متجر النخبة" />
              </label>
              <label htmlFor="siteNameEn" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>Store Name (EN)</span>
                <input id="siteNameEn" value={form.siteNameEn} onChange={e=>onChange('siteNameEn', e.target.value)} placeholder="e.g., Elite Store" />
          <Input id="siteNameEn" value={form.siteNameEn} onChange={e=>onChange('siteNameEn', e.target.value)} placeholder="e.g., Elite Store" />
                {errors.siteNameEn && <small style={{color:'#dc2626'}}>{errors.siteNameEn}</small>}
              </label>
            </div>
          </fieldset>
          </section>

          <div hidden={currentSection !== 'ui-components'}>
            <SettingsUi
              form={form}
              onChange={onChange}
              errors={errors}
              applyPreviewToApp={applyPreviewToApp}
              resetPreviewFromSetting={resetPreviewFromSetting}
              exportSettings={exportSettings}
              triggerImportClick={triggerImportClick}
              importInputRef={importInputRef}
              importSaveInputRef={importSaveInputRef}
                importAndSave={importAndSave}
                onImportFileChange={onImportFileChange}
              importing={importing}
            />
          </div>

          <section id="brand-colors" style={{scrollMarginTop:80}} hidden={currentSection !== 'brand-colors'}>
          <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
            <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>ألوان الهوية</legend>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-3)', gap:8}}>
              <label htmlFor="colorPrimary" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الأساسي</span>
                <input id="colorPrimary" type="color" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
          <Input id="colorPrimary" type="color" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
                <input aria-label="Hex" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
          <Input aria-label="Hex" value={form.colorPrimary} onChange={e=>onChange('colorPrimary', e.target.value)} />
                {errors.colorPrimary && <small style={{color:'#dc2626'}}>{errors.colorPrimary}</small>}
              </label>
              <label htmlFor="colorSecondary" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>اللون الثانوي</span>
                <input id="colorSecondary" type="color" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
          <Input id="colorSecondary" type="color" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
                <input aria-label="Hex" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
          <Input aria-label="Hex" value={form.colorSecondary} onChange={e=>onChange('colorSecondary', e.target.value)} />
                {errors.colorSecondary && <small style={{color:'#dc2626'}}>{errors.colorSecondary}</small>}
              </label>
              <label htmlFor="colorAccent" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>لون مميز</span>
                <input id="colorAccent" type="color" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
          <Input id="colorAccent" type="color" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
                <input aria-label="Hex" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
          <Input aria-label="Hex" value={form.colorAccent} onChange={e=>onChange('colorAccent', e.target.value)} />
                {errors.colorAccent && <small style={{color:'#dc2626'}}>{errors.colorAccent}</small>}
              </label>
            </div>
            <div style={{display:'flex', gap:8}}>
              <Button type="button" variant="success" onClick={applyPreviewToApp}>تطبيق المعاينة</Button>
              <Button type="button" variant="secondary" onClick={resetPreviewFromSetting}>إلغاء المعاينة</Button>
            </div>
          </fieldset>
          </section>

          <div hidden={currentSection !== 'logo-preview'}>
            <SettingsLogo
              form={form}
              previewStyle={previewStyle}
              logoPreview={logoPreview}
              setting={setting}
              logoFile={logoFile}
              logoInputRef={logoInputRef}
              onPickLogo={onPickLogo}
              uploadLogoNow={uploadLogoNow}
              uploadingLogo={uploadingLogo}
            />
          </div>

          <section id="contact-info" style={{scrollMarginTop:80}} hidden={currentSection !== 'contact-info'}>
          <div style={{display:'grid', gap:8}}>
            <span style={{fontSize:'.8rem', fontWeight:800}}>معلومات التواصل</span>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
              <label htmlFor="supportPhone" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الهاتف (هاتف)</span>
                <input id="supportPhone" value={form.supportPhone} onChange={e=>onChange('supportPhone', e.target.value)} placeholder="مثال: 920000000" />
          <Input id="supportPhone" value={form.supportPhone} onChange={e=>onChange('supportPhone', e.target.value)} placeholder="مثال: 920000000" />
                {errors.supportPhone && <small style={{color:'#dc2626'}}>{errors.supportPhone}</small>}
              </label>
              <label htmlFor="supportMobile" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>رقم الجوال (Mobile)</span>
                <input id="supportMobile" value={form.supportMobile} onChange={e=>onChange('supportMobile', e.target.value)} placeholder="مثال: +9665XXXXXXXX" />
          <Input id="supportMobile" value={form.supportMobile} onChange={e=>onChange('supportMobile', e.target.value)} placeholder="مثال: +9665XXXXXXXX" />
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
          <Input id="supportEmail" type="email" value={form.supportEmail} onChange={e=>onChange('supportEmail', e.target.value)} placeholder="support@example.com" />
                {errors.supportEmail && <small style={{color:'#dc2626'}}>{errors.supportEmail}</small>}
              </label>
              <label htmlFor="supportHours" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>ساعات العمل (اختياري)</span>
                <input id="supportHours" value={form.supportHours} onChange={e=>onChange('supportHours', e.target.value)} placeholder="مثال: 9ص - 6م (السبت-الخميس)" />
          <Input id="supportHours" value={form.supportHours} onChange={e=>onChange('supportHours', e.target.value)} placeholder="مثال: 9ص - 6م (السبت-الخميس)" />
              </label>
              <label htmlFor="taxNumber" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي (اختياري)</span>
                <input id="taxNumber" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
          <Input id="taxNumber" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
              </label>
            </div>
          </div>
          </section>

          <div hidden={currentSection !== 'company-footer'}>
            <SettingsCompanyFooter form={form} onChange={onChange} />
          </div>

          <div hidden={currentSection !== 'top-strip'}>
            <SettingsTopStrip form={form} onChange={onChange} errors={errors} />
          </div>

          <div hidden={currentSection !== 'hero'}>
            <SettingsHero form={form} onChange={onChange} errors={errors} />
          </div>

          <div hidden={currentSection !== 'whatsapp'}>
            <SettingsWhatsapp
              waDiag={waDiag}
              waLoading={waLoading}
              loadWaDiag={loadWaDiag}
              waOrderId={waOrderId}
              setWaOrderId={setWaOrderId}
              waSending={waSending}
              sendWaForOrder={sendWaForOrder}
              waSendResult={waSendResult}
            />
          </div>

          {/* Env & DB */}
          <section id="env-db" style={{scrollMarginTop:80}} hidden={currentSection !== 'env-db'}>
            <fieldset style={{display:'grid', gap:12, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
              <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>إعدادات البيئة والاتصال بقاعدة البيانات</legend>
              <EnvEditor />
            </fieldset>
          </section>

          <div hidden={currentSection !== 'shipping-payment'}>
            <SettingsShippingPayment form={form} onChange={onChange} errors={errors} />
          </div>

          <div hidden={currentSection !== 'shipping-providers'}>
            <SettingsShippingProviders form={form} onChange={onChange} errors={errors} />
          </div>

          <div hidden={currentSection !== 'links-apps'}>
            <SettingsLinksApps form={form} onChange={onChange} errors={errors} />
          </div>

          {/* Sticky save bar */}
          <div style={{position:'sticky', bottom:0, background:'rgba(255,255,255,0.7)', backdropFilter:'saturate(180%) blur(8px)', padding:'10px 0', borderTop:'1px solid #e2e8f0', display:'flex', gap:8, alignItems:'center'}}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'يحفظ...' : 'حفظ التغييرات'}
            </Button>
            <span style={{fontSize:'.75rem', opacity:.8}}>لن يتم تطبيق الألوان على الزوار حتى تحفظ التغييرات.</span>
          </div>
        </form>
      )}
    </AdminLayout>
  );
};
export default Settings;
