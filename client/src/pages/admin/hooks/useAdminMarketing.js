import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../services/api/client';
import { useToast } from '../../../contexts/ToastContext';

const toBannerPayload = (input = {}) => {
  const payload = {
    location: input.location || 'homepage',
    titleAr: input.titleAr ?? input?.title?.ar ?? '',
    titleEn: input.titleEn ?? input?.title?.en ?? '',
    bodyAr: input.bodyAr ?? input?.body?.ar ?? '',
    bodyEn: input.bodyEn ?? input?.body?.en ?? '',
    linkUrl: input.linkUrl ?? input?.link ?? input?.linkUrl ?? '',
    sort: Number.isFinite(Number(input.sort)) ? Number(input.sort) : 0,
    active: input.active !== false
  };
  return payload;
};

const bannerToFormData = (payload, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
    } else {
      formData.append(key, value);
    }
  });
  if (file) {
    formData.append('image', file);
  }
  return formData;
};

const toFeaturePayload = (input = {}) => ({
  titleAr: input.titleAr ?? input?.title?.ar ?? '',
  titleEn: input.titleEn ?? input?.title?.en ?? '',
  bodyAr: input.bodyAr ?? input?.body?.ar ?? '',
  bodyEn: input.bodyEn ?? input?.body?.en ?? '',
  icon: input.icon || '',
  sort: Number.isFinite(Number(input.sort)) ? Number(input.sort) : 0,
  active: input.active !== false
});

export const useAdminMarketing = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [banners, setBanners] = useState([]);
  const [features, setFeatures] = useState([]);
  const [appLinks, setAppLinks] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, fRes, linksRes] = await Promise.all([
        api.marketingBanners(),
        api.marketingFeatures(),
        api.marketingAppLinks()
      ]);
      setBanners(Array.isArray(bRes) ? bRes : []);
      setFeatures(Array.isArray(fRes) ? fRes : []);
      setAppLinks(Array.isArray(linksRes) ? linksRes : []);
    } catch (err) {
      setError(err?.message || 'تعذر جلب بيانات التسويق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const homeBanners = useMemo(
    () => banners.filter((banner) => !banner.location || banner.location === 'homepage'),
    [banners]
  );

  const createBanner = useCallback(
    async (input, file) => {
      setSaving(true);
      try {
        const payload = toBannerPayload(input);
        if (file instanceof File) {
          await api.marketingBannerCreateForm(bannerToFormData(payload, file));
        } else {
          await api.marketingBannerCreate(payload);
        }
        toast?.success?.('تم إنشاء البانر بنجاح');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر إنشاء البانر');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  const updateBanner = useCallback(
    async (id, input, file) => {
      if (!id) return false;
      setSaving(true);
      try {
        const payload = toBannerPayload(input);
        if (file instanceof File) {
          await api.marketingBannerUpdateForm(id, bannerToFormData(payload, file));
        } else {
          await api.marketingBannerUpdate(id, payload);
        }
        toast?.success?.('تم تحديث البانر');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر تحديث البانر');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  const deleteBanner = useCallback(
    async (id) => {
      if (!id) return false;
      setSaving(true);
      try {
        await api.marketingBannerDelete(id);
        toast?.success?.('تم حذف البانر');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر حذف البانر');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  const createFeature = useCallback(
    async (input) => {
      setSaving(true);
      try {
        const payload = toFeaturePayload(input);
        await api.marketingFeatureCreate(payload);
        toast?.success?.('تم إضافة الميزة');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر إضافة الميزة');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  const updateFeature = useCallback(
    async (id, input) => {
      if (!id) return false;
      setSaving(true);
      try {
        const payload = toFeaturePayload(input);
        await api.marketingFeatureUpdate(id, payload);
        toast?.success?.('تم تحديث الميزة');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر تحديث الميزة');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  const deleteFeature = useCallback(
    async (id) => {
      if (!id) return false;
      setSaving(true);
      try {
        await api.marketingFeatureDelete(id);
        toast?.success?.('تم حذف الميزة');
        await fetchAll();
        return true;
      } catch (err) {
        toast?.error?.(err?.message || 'تعذر حذف الميزة');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fetchAll, toast]
  );

  return {
    loading,
    saving,
    error,
    banners,
    homeBanners,
    features,
    appLinks,
    refresh: fetchAll,
    createBanner,
    updateBanner,
    deleteBanner,
    createFeature,
    updateFeature,
    deleteFeature
  };
};

export default useAdminMarketing;
