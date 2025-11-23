import React, { useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw, Upload, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useAdminMarketing } from '../hooks/useAdminMarketing';
import SafeImage from '../../../components/common/SafeImage';

const BannerForm = ({ initialData, onSubmit, onCancel, submitting }) => {
  const [formState, setFormState] = useState(() => ({
    location: initialData?.location || 'homepage',
    titleAr: initialData?.title?.ar ?? initialData?.titleAr ?? '',
    titleEn: initialData?.title?.en ?? initialData?.titleEn ?? '',
    bodyAr: initialData?.body?.ar ?? initialData?.bodyAr ?? '',
    bodyEn: initialData?.body?.en ?? initialData?.bodyEn ?? '',
    linkUrl: initialData?.linkUrl || '',
    sort: initialData?.sort ?? 0,
    active: initialData?.active !== false
  }));
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    setFile(nextFile || null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formState, file);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">موقع العرض</span>
          <Select name="location" value={formState.location} onChange={handleChange}>
            <option value="homepage">الصفحة الرئيسية</option>
            <option value="topStrip">الشريط العلوي</option>
            <option value="footer">تذييل الموقع</option>
          </Select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">رابط التحويل (اختياري)</span>
          <Input name="linkUrl" value={formState.linkUrl} onChange={handleChange} placeholder="/products" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">العنوان (عربي)</span>
          <Input name="titleAr" value={formState.titleAr} onChange={handleChange} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">العنوان (إنجليزي)</span>
          <Input name="titleEn" value={formState.titleEn} onChange={handleChange} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">النص الإضافي (عربي)</span>
          <textarea
            name="bodyAr"
            value={formState.bodyAr}
            onChange={handleChange}
            className="ui-input ui-input__native min-h-[96px]"
            placeholder="رسالة قصيرة تظهر على الشريحة"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">النص الإضافي (إنجليزي)</span>
          <textarea
            name="bodyEn"
            value={formState.bodyEn}
            onChange={handleChange}
            className="ui-input ui-input__native min-h-[96px]"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">ترتيب العرض</span>
          <Input name="sort" value={formState.sort} onChange={handleChange} type="number" min="0" />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="active" checked={formState.active} onChange={handleChange} />
          <span className="text-sm">تفعيل البانر</span>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">صورة البانر</span>
        <label className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 text-center hover:border-emerald-400">
          <ImageIcon className="h-6 w-6 text-slate-500" />
          <span className="text-xs text-slate-600">يدعم PNG / JPG / WEBP (بحد أقصى 3MB)</span>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span>اختيار صورة</span>
          </Button>
          {file ? <span className="text-xs text-emerald-600">{file.name}</span> : null}
        </label>
        {initialData?.image ? (
          <div className="rounded-lg border bg-slate-50 p-2">
            <p className="text-xs text-slate-500 mb-1">المعاينة الحالية</p>
            <SafeImage src={initialData.image} alt={initialData?.title?.ar || initialData?.titleAr || 'banner preview'} className="max-h-40 w-full rounded-md object-cover" />
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">إلغاء</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'جاري الحفظ...' : initialData ? 'تحديث البانر' : 'إنشاء البانر'}
        </Button>
      </div>
    </form>
  );
};

const FeatureForm = ({ initialData, onSubmit, onCancel, submitting }) => {
  const [formState, setFormState] = useState(() => ({
    titleAr: initialData?.title?.ar ?? initialData?.titleAr ?? '',
    titleEn: initialData?.title?.en ?? initialData?.titleEn ?? '',
    bodyAr: initialData?.body?.ar ?? initialData?.bodyAr ?? '',
    bodyEn: initialData?.body?.en ?? initialData?.bodyEn ?? '',
    icon: initialData?.icon || 'sparkles',
    sort: initialData?.sort ?? 0,
    active: initialData?.active !== false
  }));

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formState);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">العنوان (عربي)</span>
          <Input name="titleAr" value={formState.titleAr} onChange={handleChange} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">العنوان (إنجليزي)</span>
          <Input name="titleEn" value={formState.titleEn} onChange={handleChange} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">الوصف (عربي)</span>
          <textarea name="bodyAr" value={formState.bodyAr} onChange={handleChange} className="ui-input ui-input__native min-h-[96px]" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">الوصف (إنجليزي)</span>
          <textarea name="bodyEn" value={formState.bodyEn} onChange={handleChange} className="ui-input ui-input__native min-h-[96px]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">رمز أيقونة (lucide)</span>
          <Input name="icon" value={formState.icon} onChange={handleChange} placeholder="sparkles" />
          <span className="text-xs text-slate-500">أمثلة: sparkles, truck, shield, headset</span>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">ترتيب الظهور</span>
          <Input name="sort" value={formState.sort} onChange={handleChange} type="number" min="0" />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="active" checked={formState.active} onChange={handleChange} />
          <span className="text-sm">تفعيل الميزة</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">إلغاء</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'جاري الحفظ...' : initialData ? 'تحديث الميزة' : 'إضافة الميزة'}
        </Button>
      </div>
    </form>
  );
};

const MarketingView = () => {
  const {
    loading,
    saving,
    error,
    banners,
    homeBanners,
    features,
    refresh,
    createBanner,
    updateBanner,
    deleteBanner,
    createFeature,
    updateFeature,
    deleteFeature
  } = useAdminMarketing();

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);

  const sortedHomeBanners = useMemo(
    () => [...homeBanners].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [homeBanners]
  );

  const sortedFeatures = useMemo(
    () => [...features].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [features]
  );

  const openNewBannerModal = () => {
    setEditingBanner(null);
    setBannerModalOpen(true);
  };

  const openEditBannerModal = (banner) => {
    setEditingBanner(banner);
    setBannerModalOpen(true);
  };

  const handleBannerSubmit = async (values, file) => {
    const ok = editingBanner
      ? await updateBanner(editingBanner.id, values, file)
      : await createBanner(values, file);
    if (ok) {
      setBannerModalOpen(false);
      setEditingBanner(null);
    }
  };

  const openNewFeatureModal = () => {
    setEditingFeature(null);
    setFeatureModalOpen(true);
  };

  const openEditFeatureModal = (feature) => {
    setEditingFeature(feature);
    setFeatureModalOpen(true);
  };

  const handleFeatureSubmit = async (values) => {
    const ok = editingFeature
      ? await updateFeature(editingFeature.id, values)
      : await createFeature(values);
    if (ok) {
      setFeatureModalOpen(false);
      setEditingFeature(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">إدارة الصفحة الرئيسية</h2>
          <p className="text-sm text-slate-600">تحكم في بانرات الهيرو ورسائل القيمة السريعة التي تظهر للعملاء.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={loading || saving}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={openNewFeatureModal}>
            <Plus className="h-4 w-4" />
            <span>إضافة ميزة</span>
          </Button>
          <Button size="sm" className="gap-2" onClick={openNewBannerModal}>
            <Plus className="h-4 w-4" />
            <span>إضافة بانر</span>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>بانرات الصفحة الرئيسية</CardTitle>
          <p className="text-sm text-slate-500">يمكنك إضافة حتى 5 شرائح. يتم استخدام الترتيب الأدنى كأولوية أولى.</p>
        </CardHeader>
        <CardContent>
          {sortedHomeBanners.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              لا توجد بانرات حالياً. ابدأ بإضافة بانر جديد يظهر في الهيرو.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2 text-right">الصورة</th>
                    <th className="px-3 py-2 text-right">العنوان</th>
                    <th className="px-3 py-2 text-right">الحالة</th>
                    <th className="px-3 py-2 text-right">الرابط</th>
                    <th className="px-3 py-2 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHomeBanners.map((banner) => (
                    <tr key={banner.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-semibold text-slate-700">{banner.sort ?? 0}</td>
                      <td className="px-3 py-2">
                        {banner.image ? (
                          <SafeImage src={banner.image} alt={banner?.title?.ar || banner?.title?.en || 'banner'} className="h-14 w-28 rounded-md object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">بدون صورة</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{banner?.title?.ar || banner?.title?.en || '—'}</div>
                        {banner?.title?.en ? (
                          <div className="text-xs text-slate-500">{banner.title.en}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={banner.active === false ? 'warning' : 'success'}>
                          {banner.active === false ? 'غير مفعل' : 'مفعل'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {banner.linkUrl ? banner.linkUrl : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditBannerModal(banner)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => {
                              if (window.confirm('تأكيد حذف البانر؟')) {
                                deleteBanner(banner.id);
                              }
                            }}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>رسائل القيمة السريعة (الهيرو)</CardTitle>
          <p className="text-sm text-slate-500">تظهر هذه الرسائل أسفل الهيرو وتوضح أهم مميزات المتجر للعملاء.</p>
        </CardHeader>
        <CardContent>
          {sortedFeatures.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              لم تتم إضافة أي عناصر بعد. استخدم زر "إضافة ميزة" لبدء الإنشاء.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFeatures.map((feature) => (
                <div key={feature.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{feature.icon || 'sparkles'}</Badge>
                      <span className="font-semibold text-slate-800">{feature?.title?.ar || feature?.title?.en || '—'}</span>
                    </div>
                    <p className="text-sm text-slate-500">{feature?.body?.ar || feature?.body?.en || '—'}</p>
                    <p className="text-xs text-slate-400">الترتيب: {feature.sort ?? 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={feature.active === false ? 'warning' : 'success'}>
                      {feature.active === false ? 'غير مفعل' : 'مفعل'}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditFeatureModal(feature)}>
                      <Pencil className="h-4 w-4" />
                      <span>تعديل</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('تأكيد حذف الميزة؟')) {
                          deleteFeature(feature.id);
                        }
                      }}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={bannerModalOpen}
        onClose={() => {
          if (!saving) {
            setBannerModalOpen(false);
            setEditingBanner(null);
          }
        }}
        title={editingBanner ? 'تعديل بانر' : 'إضافة بانر جديد'}
        size="lg"
      >
        <BannerForm
          initialData={editingBanner}
          onSubmit={handleBannerSubmit}
          onCancel={() => {
            setBannerModalOpen(false);
            setEditingBanner(null);
          }}
          submitting={saving}
        />
      </Modal>

      <Modal
        open={featureModalOpen}
        onClose={() => {
          if (!saving) {
            setFeatureModalOpen(false);
            setEditingFeature(null);
          }
        }}
        title={editingFeature ? 'تعديل ميزة' : 'إضافة ميزة جديدة'}
        size="md"
      >
        <FeatureForm
          initialData={editingFeature}
          onSubmit={handleFeatureSubmit}
          onCancel={() => {
            setFeatureModalOpen(false);
            setEditingFeature(null);
          }}
          submitting={saving}
        />
      </Modal>
    </div>
  );
};

export default MarketingView;
