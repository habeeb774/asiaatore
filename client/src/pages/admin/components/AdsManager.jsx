import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil, Megaphone, ExternalLink, ToggleLeft, ToggleRight, Link2 } from 'lucide-react';
import api from '../../../services/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import SafeImage from '../../../components/common/SafeImage';

const emptyAd = { title: '', body: '', image: '', linkUrl: '', status: true };

const AdsManager = () => {
  const [ads, setAds] = useState([]);
  const [formState, setFormState] = useState(() => ({ ...emptyAd }));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormState(() => ({ ...emptyAd }));
    setEditingId(null);
  };

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listAds();
      setAds(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setError('تعذر تحميل بيانات الإعلانات. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const upsertAd = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formState.title,
        description: formState.body,
        image: formState.image,
        link: formState.linkUrl,
        active: formState.status
      };

      if (editingId) {
        await api.updateAd(editingId, payload);
      } else {
        await api.createAd(payload);
      }

      resetForm();
      await fetchAds();
      setError(null);
    } catch (err) {
      setError('تعذر حفظ الإعلان. تحقق من الحقول وحاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ad) => {
    setEditingId(ad.id);
    setFormState({
      title: ad.title || '',
      body: ad.description || '',
      image: ad.image || '',
      linkUrl: ad.link || '',
      status: ad.active !== false
    });
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('هل أنت متأكد من حذف الإعلان؟')) {
      return;
    }

    setSaving(true);
    try {
      await api.deleteAd(adId);
      await fetchAds();
      setError(null);
    } catch (err) {
      setError('تعذر حذف الإعلان. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (ad) => {
    setSaving(true);
    try {
      await api.updateAd(ad.id, { active: !ad.active });
      await fetchAds();
      setError(null);
    } catch (err) {
      setError('تعذر تحديث حالة الإعلان. حاول من جديد.');
    } finally {
      setSaving(false);
    }
  };

  const sortedAds = useMemo(
    () => [...ads].sort((a, b) => (new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))),
    [ads]
  );

  return (
    <section id="ads-section" className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-slate-50 p-4 border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Megaphone className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">إدارة الحملات الإعلانية</h3>
            <p className="text-xs text-slate-500">إعلانات وروابط التحويل</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchAds} disabled={loading || saving}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          {editingId && (
            <Button variant="outline" size="sm" onClick={resetForm} disabled={saving} className="border-amber-200 text-amber-600 hover:bg-amber-50">
              إلغاء التعديل
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-center gap-2">
          <span className="text-amber-500">⚠</span> {error}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white rounded-t-xl border-b">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">{editingId ? 'تعديل إعلان' : 'إنشاء إعلان جديد'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <form className="space-y-5" onSubmit={upsertAd}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">عنوان الإعلان</span>
                <Input name="title" value={formState.title} onChange={handleChange} required placeholder="عنوان جذاب للإعلان" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">رابط الصورة</span>
                <Input name="image" value={formState.image} onChange={handleChange} required placeholder="https://..." />
              </label>
              <label className="md:col-span-2 space-y-1.5">
                <span className="text-sm font-medium text-slate-700">وصف الإعلان</span>
                <textarea
                  name="body"
                  value={formState.body}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[96px] resize-none"
                  placeholder="نص قصير يشرح العرض..."
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  رابط التحويل
                </span>
                <Input name="linkUrl" value={formState.linkUrl} onChange={handleChange} placeholder="https://example.com/landing" />
              </label>
              <label className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, status: !prev.status }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formState.status ? 'bg-purple-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formState.status ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">{formState.status ? 'مفعّل' : 'معطّل'}</span>
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="gap-2 bg-purple-600 hover:bg-purple-700" disabled={saving}>
                <Plus className="h-4 w-4" />
                <span>{editingId ? 'تحديث الإعلان' : 'إضافة الإعلان'}</span>
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  إلغاء
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-xl border-b">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">قائمة الإعلانات</CardTitle>
          </div>
          <p className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{sortedAds.length} إعلان</p>
        </CardHeader>
        <CardContent className="p-4">
          {loading && sortedAds.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto text-slate-300 mb-3 animate-spin" />
              <p className="text-slate-500">يتم تحميل الإعلانات...</p>
            </div>
          ) : sortedAds.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">لا توجد إعلانات حالياً</p>
              <p className="text-slate-400 text-sm">أنشئ إعلانك الأول من النموذج أعلاه</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedAds.map((ad) => (
                <div key={ad.id} className="group relative rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all bg-white">
                  {/* Image */}
                  <div className="relative h-40 bg-slate-100">
                    {ad.image ? (
                      <SafeImage src={ad.image} alt={ad.title || 'ad'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Megaphone className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant={ad.active ? 'success' : 'warning'} className="shadow-sm">
                        {ad.active ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" className="bg-white hover:bg-white" onClick={() => handleEdit(ad)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white hover:bg-white"
                        onClick={() => toggleStatus(ad)}
                        disabled={saving}
                      >
                        {ad.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                      </Button>
                      <Button variant="danger" size="icon" onClick={() => handleDelete(ad.id)} disabled={saving}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-800 mb-1 truncate">{ad.title || '—'}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ad.description || 'بدون وصف'}</p>
                    {ad.link && (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{ad.link}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default AdsManager;
