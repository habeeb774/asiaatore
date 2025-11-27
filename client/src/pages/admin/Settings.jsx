import React, { useEffect, useMemo, useRef, useState } from 'react';
import Seo from '../../components/Seo';
import AdminLayout from '../../components/features/admin/AdminLayout';
import { useSettings } from '../../contexts/SettingsContext';
import { Button, Input } from '../../components/ui';
import EnvEditor from './integrations/EnvEditor';
import SettingsUi from './settings/SettingsUi';
import SettingsLogo from './settings/SettingsLogo';
import SettingsWhatsapp from './settings/SettingsWhatsapp';
import SettingsShippingPayment from './settings/SettingsShippingPayment';
import SettingsShippingProviders from './settings/SettingsShippingProviders';
import SettingsLinksApps from './settings/SettingsLinksApps';
import SettingsCompanyFooter from './settings/SettingsCompanyFooter';
import SettingsTopStrip from './settings/SettingsTopStrip';
import SettingsHero from './settings/SettingsHero';
import { LayoutGrid, Palette, Image as ImageIcon, Phone, Building, TicketPercent, MessageCircle, Database, CreditCard, Truck, Link as LinkIcon, Search, Star } from 'lucide-react';
import SaveBar from '../../components/features/admin/forms/SaveBar';
import FormField from '../../components/features/admin/forms/FormField';
import Fieldset from '../../components/features/admin/forms/Fieldset';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, validateSettings } from '../../validation/settingsSchema';

const Settings = () => {
  const { setting, loading, error, update, uploadLogo } = useSettings();
  const [form, setForm] = useState({
    siteNameAr:'', siteNameEn:'',
    colorPrimary:'#ED1C24', colorSecondary:'#1C75BC', colorAccent:'#ACCCE6',
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
  const formMethods = useForm({ resolver: zodResolver(settingsSchema), mode: 'onChange', defaultValues: form });

  useEffect(() => {
    if (setting) {
      setForm(f => {
        const next = {
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
      };
        try { formMethods.reset(next); } catch {}
        return next;
      });
    }
  }, [setting]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Helper: normalize value for comparison (handle color case-insensitivity)
  const normalizeForCompare = (k, v) => {
    if (v === null || v === undefined) return '';
    // Normalize hex colors to lowercase for consistent comparison
    if (['colorPrimary', 'colorSecondary', 'colorAccent', 'topStripBackground'].includes(k)) {
      return String(v).toLowerCase();
    }
    return v;
  };

  // Helper: check if values are effectively equal
  const valuesEqual = (k, formVal, settingVal) => {
    return normalizeForCompare(k, formVal) === normalizeForCompare(k, settingVal);
  };

  // Helpers: basic validation
  const isHex = (s) => /^#([0-9a-fA-F]{6})$/.test(String(s || ''));
  const isEmail = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
  const isUrl = (s) => {
    if (!s) return true;
    try { new URL(s); return true; } catch { return false; }
  };
  const isDigits = (s) => !s || /^[0-9+\s-]+$/.test(String(s));

  const validate = () => {
    const { success, errors: e } = validateSettings(form);
    setErrors(e);
    return success;
  };

  const computedChanges = useMemo(() => {
    const changed = {};
    if (setting) {
      Object.keys(form).forEach(k => {
        if (!valuesEqual(k, form[k], setting[k]) && (form[k] !== '' || (setting[k] !== undefined && setting[k] !== null && setting[k] !== ''))) {
          changed[k] = form[k];
        }
      });
    } else {
      Object.assign(changed, form);
    }
    return changed;
  }, [form, setting]);

  const isDirty = useMemo(() => Object.keys(computedChanges).length > 0 || !!logoFile, [computedChanges, logoFile]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      if (!validate()) { setMsg('يرجى تصحيح الحقول المظللة'); setSaving(false); return; }
      // Only send changed fields that are not empty (unless original was also empty/null)
      const changed = {};
      if (setting) {
        Object.keys(form).forEach(k => {
          if (!valuesEqual(k, form[k], setting[k]) && (form[k] !== '' || (setting[k] !== undefined && setting[k] !== null && setting[k] !== ''))) {
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
      root.style.setProperty('--color-primary-alt', form.colorSecondary);
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
      root.style.setProperty('--color-primary', setting?.colorPrimary || '#ED1C24');
      root.style.setProperty('--color-secondary', setting?.colorSecondary || '#1C75BC');
      root.style.setProperty('--color-primary-alt', setting?.colorSecondary || '#1C75BC');
      root.style.setProperty('--color-accent', setting?.colorAccent || '#ACCCE6');
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

  // SEO preview: set document title and OG/Twitter meta tags based on form values (without saving)
  const applySeoPreviewToApp = () => {
    try {
      const title = form.siteNameEn || form.siteNameAr || '';
      if (title) document.title = title;
      const setMeta = (nameOrProp, content, prop = false) => {
        try {
          const attribute = prop ? 'property' : 'name';
          let el = document.head.querySelector(`meta[${attribute}="${nameOrProp}"]`);
          if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attribute, nameOrProp);
            document.head.appendChild(el);
          }
          el.setAttribute('content', content);
        } catch {}
      };
      if (title) {
        setMeta('og:site_name', title, true);
        setMeta('twitter:title', title);
        setMeta('og:title', title, true);
      }
      setMsg('تم تطبيق معاينة SEO');
    } catch {}
  };

  const resetSeoPreviewFromSetting = () => {
    try {
      const siteName = setting?.siteNameEn || setting?.siteNameAr || setting?.siteName || '';
      if (siteName) document.title = siteName;
      const setMeta = (nameOrProp, content, prop = false) => {
        try {
          const attribute = prop ? 'property' : 'name';
          let el = document.head.querySelector(`meta[${attribute}="${nameOrProp}"]`);
          if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attribute, nameOrProp);
            document.head.appendChild(el);
          }
          el.setAttribute('content', content);
        } catch {}
      };
      if (siteName) {
        setMeta('og:site_name', siteName, true);
        setMeta('twitter:title', siteName);
        setMeta('og:title', siteName, true);
      }
      setMsg('تمت إعادة معاينة SEO إلى القيم الحالية');
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
    if (isDirty && !confirm('لديك تغييرات غير محفوظة. هل تريد المتابعة دون حفظ؟')) return;
    setCurrentSection(id);
    setNavOpen(false);
    // Optional smooth scroll if needed
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }, 50);
  };

  const [sectionQuery, setSectionQuery] = useState('');
  const sectionSearchRef = useRef(null);
  const filteredSections = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(s => (s.label || '').toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [sections, sectionQuery]);
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin.settings.pinned') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('admin.settings.pinned', JSON.stringify(pinned)); } catch {}
  }, [pinned]);
  const togglePin = (id) => {
    setPinned((arr) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  };
  useEffect(() => {
    if (navOpen) {
      try { sectionSearchRef.current?.focus(); } catch {}
    }
  }, [navOpen]);
  useEffect(() => {
    if (!navOpen) setSectionQuery('');
  }, [navOpen]);
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin.settings.currentSection');
      if (saved && sections.some(s=>s.id===saved)) setCurrentSection(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('admin.settings.currentSection', currentSection); } catch {}
  }, [currentSection]);
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = String(e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 's') {
        e.preventDefault();
        try { document.querySelector('form.settings-form button[type="submit"]').click(); } catch {}
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const iconFor = (id) => {
    switch (id) {
      case 'store-info': return <Building size={16} />;
      case 'brand-colors': return <Palette size={16} />;
      case 'ui-components': return <LayoutGrid size={16} />;
      case 'logo-preview': return <ImageIcon size={16} />;
      case 'contact-info': return <Phone size={16} />;
      case 'company-footer': return <Building size={16} />;
      case 'top-strip': return <TicketPercent size={16} />;
      case 'hero': return <ImageIcon size={16} />;
      case 'whatsapp': return <MessageCircle size={16} />;
      case 'env-db': return <Database size={16} />;
      case 'shipping-payment': return <CreditCard size={16} />;
      case 'shipping-providers': return <Truck size={16} />;
      case 'links-apps': return <LinkIcon size={16} />;
      default: return <LayoutGrid size={16} />;
    }
  };

  return (
    <AdminLayout title="الإعدادات / Settings">
      <Seo title="الإعدادات | Settings" description="Store settings" />
      <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'space-between'}}>
        <div style={{margin:0}} />
        <Button type="button" variant="secondary" size="sm" aria-controls="settings-sections-drawer" aria-expanded={navOpen ? 'true' : 'false'} onClick={()=> setNavOpen(true)}>
          قائمة الأقسام
        </Button>
      </div>
      {/* Drawer */}
      {navOpen && (
        <>
          <div onClick={()=> setNavOpen(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, transition:'opacity .2s ease-out'}} />
          <aside id="settings-sections-drawer" role="dialog" aria-modal="true" aria-label="قائمة الأقسام" style={{position:'fixed', insetBlockStart:0, insetInlineEnd:0, blockSize:'100dvh', inlineSize:'min(92vw, 360px)', background:'#fff', borderInlineStart:'1px solid #e2e8f0', zIndex:60, display:'grid', gridTemplateRows:'auto auto 1fr', boxShadow:'-12px 0 24px -16px rgba(0,0,0,.25)', transform:'translateX(0)', transition:'transform .25s ease-out'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', borderBlockEnd:'1px solid #e2e8f0'}}>
              <strong style={{fontSize:'.95rem'}}>أقسام الإعدادات</strong>
              <Button type="button" variant="ghost" size="sm" onClick={()=> setNavOpen(false)}>إغلاق</Button>
            </div>
            <div style={{padding:'8px 12px', borderBlockEnd:'1px solid #e2e8f0'}}>
              <Input ref={sectionSearchRef} size="sm" placeholder="ابحث عن قسم..." value={sectionQuery} onChange={e=>setSectionQuery(e.target.value)} leading={<Search size={14} />} />
            </div>
            <nav style={{padding:'8px 8px 12px', overflow:'auto'}}>
              {(() => {
                const list = filteredSections;
                const fav = list.filter(s => pinned.includes(s.id));
                const rest = list.filter(s => !pinned.includes(s.id));
                const renderGroup = (items, title) => (
                  items.length ? (
                    <>
                      {title ? <div style={{padding:'6px 8px', fontSize:'.72rem', opacity:.7}}>{title}</div> : null}
                      <ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:6}}>
                        {items.map(s => {
                          const active = currentSection === s.id;
                          const isPinned = pinned.includes(s.id);
                          return (
                            <li key={s.id}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-current={active ? 'true' : undefined}
                                onClick={()=> goTo(s.id)}
                                style={{
                                  width:'100%',
                                  justifyContent:'flex-start',
                                  gap:8,
                                  background: active ? 'rgba(16,185,129,0.1)' : undefined,
                                  border: active ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent'
                                }}
                              >
                                <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center', color: active ? 'rgb(5,150,105)' : '#64748b'}}>
                                  {iconFor(s.id)}
                                </span>
                                <span style={{fontSize:'.9rem'}}>{s.label}</span>
                                <span style={{marginInlineStart:'auto'}} />
                                <span role="button" tabIndex={0} aria-label={isPinned ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} onClick={(e)=>{e.stopPropagation(); togglePin(s.id);}} onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); e.stopPropagation(); togglePin(s.id); } }} style={{display:'inline-flex', alignItems:'center', justifyContent:'center', padding:4, color: isPinned ? 'rgb(234,179,8)' : '#94a3b8'}}>
                                  <Star size={16} fill={isPinned ? 'rgb(234,179,8)' : 'none'} />
                                </span>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : null
                );
                return (
                  <div style={{display:'grid', gap:8}}>
                    {renderGroup(fav, 'مفضلة')}
                    {renderGroup(rest, fav.length ? 'كل الأقسام' : '')}
                  </div>
                );
              })()}
            </nav>
          </aside>
        </>
      )}
      <div aria-live="polite" style={{minHeight:24, marginBottom:8, color: msg?.startsWith('فشل') ? 'var(--color-danger)' : 'var(--color-primary-alt)'}}>{msg}</div>
      {loading ? (
        <p>يتم التحميل...</p>
      ) : error ? (
        <p className="error">خطأ: {error}</p>
      ) : (
        <FormProvider {...formMethods}>
          <form onSubmit={submit} className="settings-form" style={{display:'grid', gap:12, maxWidth:880}}>
            <section id="store-info" style={{scrollMarginTop:80}} hidden={currentSection !== 'store-info'}>
  <Fieldset title="معلومات المتجر">
    <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
      <FormField htmlFor="siteNameAr" label="اسم المتجر (AR)">
        <Controller
          name="siteNameAr"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              id="siteNameAr"
              value={field.value ?? ''}
              onChange={e => { const v = e.target.value; field.onChange(v); onChange('siteNameAr', v); }}
              placeholder="مثال: متجر النخبة"
            />
          )}
        />
      </FormField>
      <FormField htmlFor="siteNameEn" label="Store Name (EN)" error={errors.siteNameEn || formMethods.formState.errors.siteNameEn?.message}>
        <Controller
          name="siteNameEn"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              id="siteNameEn"
              value={field.value ?? ''}
              onChange={e => { const v = e.target.value; field.onChange(v); onChange('siteNameEn', v); }}
              placeholder="e.g., Elite Store"
            />
          )}
        />
      </FormField>
    </div>
            {/* SEO Preview */}
            <div style={{marginTop:8, borderTop:'1px dashed #e2e8f0', paddingTop:8, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'.9rem', fontWeight:700}}>معاينة SEO</div>
                <div style={{fontSize:'.85rem', color:'#374151'}}>العنوان: <strong>{form.siteNameEn || form.siteNameAr || '—'}</strong></div>
                <div style={{fontSize:'.8rem', color:'#6b7280'}}>og:site_name: <strong>{form.siteNameEn || form.siteNameAr || '—'}</strong></div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <Button type="button" variant="success" size="sm" onClick={applySeoPreviewToApp}>تطبيق معاينة SEO</Button>
                <Button type="button" variant="secondary" size="sm" onClick={resetSeoPreviewFromSetting}>إعادة معاينة SEO</Button>
              </div>
            </div>
          </Fieldset>
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
          <Fieldset title="ألوان الهوية">
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-3)', gap:8}}>
              <FormField htmlFor="colorPrimary" label="اللون الأساسي" error={errors.colorPrimary || formMethods.formState.errors.colorPrimary?.message}>
                <Controller
                  name="colorPrimary"
                  control={formMethods.control}
                  render={({ field }) => (
                    <>
                      <Input id="colorPrimary" type="color" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorPrimary', v); }} />
                      <Input aria-label="Hex" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorPrimary', v); }} />
                    </>
                  )}
                />
              </FormField>
              <FormField htmlFor="colorSecondary" label="اللون الثانوي" error={errors.colorSecondary || formMethods.formState.errors.colorSecondary?.message}>
                <Controller
                  name="colorSecondary"
                  control={formMethods.control}
                  render={({ field }) => (
                    <>
                      <Input id="colorSecondary" type="color" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorSecondary', v); }} />
                      <Input aria-label="Hex" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorSecondary', v); }} />
                    </>
                  )}
                />
              </FormField>
              <FormField htmlFor="colorAccent" label="لون مميز" error={errors.colorAccent || formMethods.formState.errors.colorAccent?.message}>
                <Controller
                  name="colorAccent"
                  control={formMethods.control}
                  render={({ field }) => (
                    <>
                      <Input id="colorAccent" type="color" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorAccent', v); }} />
                      <Input aria-label="Hex" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('colorAccent', v); }} />
                    </>
                  )}
                />
              </FormField>
            </div>
            <div style={{display:'flex', gap:8}}>
              <Button type="button" variant="success" onClick={applyPreviewToApp}>تطبيق المعاينة</Button>
              <Button type="button" variant="secondary" onClick={resetPreviewFromSetting}>إلغاء المعاينة</Button>
            </div>
          </Fieldset>
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
              <FormField htmlFor="supportPhone" label="رقم الهاتف (هاتف)" error={errors.supportPhone || formMethods.formState.errors.supportPhone?.message}>
                <Controller
                  name="supportPhone"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input id="supportPhone" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('supportPhone', v); }} placeholder="مثال: 920000000" />
                  )}
                />
              </FormField>
              <FormField htmlFor="supportMobile" label="رقم الجوال (Mobile)" error={errors.supportMobile || formMethods.formState.errors.supportMobile?.message}>
                <Controller
                  name="supportMobile"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input id="supportMobile" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('supportMobile', v); }} placeholder="مثال: +9665XXXXXXXX" />
                  )}
                />
              </FormField>
              <FormField htmlFor="supportWhatsapp" label="واتساب (أرقام فقط)" hint={"سيستخدم كرابط wa.me/الرقم"}>
                <Controller
                  name="supportWhatsapp"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input
                      id="supportWhatsapp"
                      value={field.value ?? ''}
                      onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('supportWhatsapp', v); }}
                      onBlur={e=>{ const v=e.target.value.replace(/\D+/g,''); field.onBlur(); field.onChange(v); onChange('supportWhatsapp', v); }}
                      placeholder="مثال: 9665XXXXXXXX"
                    />
                  )}
                />
              </FormField>
              <FormField htmlFor="supportEmail" label="البريد الإلكتروني" error={errors.supportEmail || formMethods.formState.errors.supportEmail?.message}>
                <Controller
                  name="supportEmail"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input id="supportEmail" type="email" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('supportEmail', v); }} placeholder="support@example.com" />
                  )}
                />
              </FormField>
              <FormField htmlFor="supportHours" label="ساعات العمل (اختياري)">
                <Controller
                  name="supportHours"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input id="supportHours" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('supportHours', v); }} placeholder="مثال: 9ص - 6م (السبت-الخميس)" />
                  )}
                />
              </FormField>
              <FormField htmlFor="taxNumber" label="الرقم الضريبي (اختياري)">
                <Controller
                  name="taxNumber"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Input id="taxNumber" value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('taxNumber', v); }} placeholder="مثال: 311307460300003" />
                  )}
                />
              </FormField>
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
          <SaveBar saving={saving} canSave={isDirty} note={'لن يتم تطبيق الألوان على الزوار حتى تحفظ التغييرات.'} />
        </form>
        </FormProvider>
      )}
    </AdminLayout>
  );
};
export default Settings;
