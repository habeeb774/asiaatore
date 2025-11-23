import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import DataTable from '../../../components/features/admin/DataTable';
import ConfirmModal from '../../../components/features/admin/ConfirmModal';
import AdminTableSkeleton from '../../../components/features/admin/AdminTableSkeleton';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import Seo from '../../../components/Seo';
import useCategories from '../../../hooks/useCategories';
import api from '../../../services/api/client';
import { useToast } from '../../../contexts/ToastContext';

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function formatError(err) {
  if (!err) return null;
  const code = err?.code || err?.data?.error;
  if (code === 'SLUG_EXISTS') return 'المعرف مستخدم بالفعل، يرجى اختيار معرف آخر.';
  if (code === 'NOT_FOUND') return 'التصنيف غير موجود أو حُذف مسبقاً.';
  return err?.data?.message || err?.message || 'حدث خطأ غير متوقع.';
}

function toNullable(value) {
  const trimmed = String(value || '').trim();
  return trimmed.length ? trimmed : null;
}

function CategoryModal({ open, mode, initialData, onClose, onSubmit, submitting, errorMessage }) {
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    descriptionAr: '',
    descriptionEn: '',
  });
  const [slugLocked, setSlugLocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      nameAr: initialData?.name?.ar || '',
      nameEn: initialData?.name?.en || '',
      slug: initialData?.slug || '',
      descriptionAr: initialData?.description?.ar || '',
      descriptionEn: initialData?.description?.en || '',
    });
    setSlugLocked(Boolean(initialData?.slug));
  }, [open, initialData]);

  const nameEnValue = form.nameEn;

  useEffect(() => {
    if (!open || slugLocked) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.nameEn) }));
  }, [open, slugLocked, nameEnValue]);

  const isValid = Boolean(form.nameAr.trim() && form.nameEn.trim() && form.slug.trim());

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlugBlur = () => {
    setForm((prev) => ({ ...prev, slug: slugify(prev.slug) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    onSubmit?.({
      slug: slugify(form.slug.trim()),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: toNullable(form.descriptionAr),
      descriptionEn: toNullable(form.descriptionEn),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={mode === 'edit' ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nameAr">الاسم (عربي)</Label>
            <Input
              id="nameAr"
              name="nameAr"
              value={form.nameAr}
              onChange={handleChange}
              placeholder="مثال: الفواكه الطازجة"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
            <Input
              id="nameEn"
              name="nameEn"
              value={form.nameEn}
              onChange={handleChange}
              placeholder="e.g. Fresh Fruits"
              autoComplete="off"
              dir="ltr"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="slug">المعرف (Slug)</Label>
            <Input
              id="slug"
              name="slug"
              dir="ltr"
              value={form.slug}
              onFocus={() => setSlugLocked(true)}
              onChange={handleChange}
              onBlur={handleSlugBlur}
              placeholder="fresh-fruits"
              autoComplete="off"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              سيُستخدم هذا المعرف في الروابط، يفضّل الأحرف اللاتينية والأشرطة بين الكلمات.
            </p>
          </div>
          <div>
            <Label htmlFor="descriptionAr">الوصف (عربي)</Label>
            <textarea
              id="descriptionAr"
              name="descriptionAr"
              value={form.descriptionAr}
              onChange={handleChange}
              rows={3}
              className="ui-input ui-input__native min-h-[96px]"
              placeholder="وصف مختصر للتصنيف"
            />
          </div>
          <div>
            <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              value={form.descriptionEn}
              onChange={handleChange}
              rows={3}
              className="ui-input ui-input__native min-h-[96px]"
              placeholder="Short description"
              dir="ltr"
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={!isValid || submitting}>
            {submitting ? 'جارٍ الحفظ...' : mode === 'edit' ? 'حفظ التغييرات' : 'إضافة التصنيف'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoriesAdmin() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading, isFetching, error, refetch } = useCategories({ withCounts: 1 });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', category: null });
  const [confirmCategory, setConfirmCategory] = useState(null);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((cat) => {
      const slug = cat.slug?.toLowerCase() || '';
      const nameAr = cat.name?.ar?.toLowerCase() || '';
      const nameEn = cat.name?.en?.toLowerCase() || '';
      return slug.includes(term) || nameAr.includes(term) || nameEn.includes(term);
    });
  }, [categories, search]);

  const totalPages = useMemo(() => {
    const divisor = Math.max(1, pageSize);
    return Math.max(1, Math.ceil(filteredCategories.length / divisor));
  }, [filteredCategories.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openCreate = useCallback(() => {
    setModalState({ open: true, mode: 'create', category: null });
  }, []);

  const openEdit = useCallback((category) => {
    setModalState({ open: true, mode: 'edit', category });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false, mode: 'create', category: null });
  }, []);

  const requestDelete = useCallback((category) => {
    setConfirmCategory(category);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmCategory(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload) => api.categoryCreate(payload),
    onSuccess: () => {
      toast?.success?.('تم إنشاء التصنيف', 'تم حفظ التصنيف بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
      createMutation.reset();
    },
    onError: (err) => {
      toast?.error?.('فشل إنشاء التصنيف', formatError(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.categoryUpdate(id, payload),
    onSuccess: () => {
      toast?.success?.('تم تحديث التصنيف', 'تم حفظ التغييرات.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
      updateMutation.reset();
    },
    onError: (err) => {
      toast?.error?.('فشل تحديث التصنيف', formatError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.categoryDelete(id),
    onSuccess: () => {
      toast?.success?.('تم حذف التصنيف');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeConfirm();
      createMutation.reset();
      updateMutation.reset();
    },
    onError: (err) => {
      toast?.error?.('فشل حذف التصنيف', formatError(err));
    },
  });

  const handleModalClose = useCallback(() => {
    closeModal();
    createMutation.reset();
    updateMutation.reset();
  }, [closeModal, createMutation, updateMutation]);

  const mutationError = formatError(
    modalState.mode === 'edit' ? updateMutation.error : createMutation.error
  );

  const submitting = modalState.mode === 'edit' ? updateMutation.isPending : createMutation.isPending;

  const columns = useMemo(() => [
    {
      header: 'التصنيف',
      cell: (row) => (
        <div className="leading-tight">
          <div className="font-medium">{row.name?.ar || row.name?.en || row.slug}</div>
          {row.name?.en ? (
            <div className="text-xs text-slate-500 ltr:text-left rtl:text-right">{row.name.en}</div>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Slug',
      cell: (row) => (
        <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded" dir="ltr">
          {row.slug}
        </code>
      ),
    },
    {
      header: 'عدد المنتجات',
      cell: (row) => row.productCount ?? '—',
      width: '120px',
    },
    {
      header: 'آخر تحديث',
      cell: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('ar-SA') : '—'),
      width: '140px',
    },
    {
      header: 'إجراءات',
      width: '200px',
      cell: (row) => (
        <div className="flex items-center gap-2" data-prevent-row-click>
          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
            تعديل
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => requestDelete(row)}
            disabled={deleteMutation.isPending}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ], [openEdit, requestDelete, deleteMutation.isPending]);

  const topbar = (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        size="sm"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="ابحث عن تصنيف..."
        className="w-full sm:w-auto sm:min-w-[220px]"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isFetching && !isLoading}
      >
        {isFetching && !isLoading ? 'جارٍ التحديث...' : 'تحديث'}
      </Button>
      <Button variant="primary" size="sm" onClick={openCreate}>
        إضافة تصنيف
      </Button>
      <span className="text-xs text-slate-500">
        {isFetching && isLoading ? 'جارٍ تحميل البيانات...' : `${filteredCategories.length} تصنيف`}
      </span>
      {error ? (
        <span className="text-xs text-red-600">{formatError(error)}</span>
      ) : null}
    </div>
  );

  return (
    <AdminLayout title="إدارة التصنيفات" topbar={topbar}>
      <Seo title="إدارة التصنيفات" />
      {isLoading ? (
        <AdminTableSkeleton rows={6} cols={columns.length} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredCategories}
          page={page}
          pageSize={pageSize}
          total={filteredCategories.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <CategoryModal
        open={modalState.open}
        mode={modalState.mode}
        initialData={modalState.category}
        onClose={handleModalClose}
        onSubmit={(payload) => {
          if (modalState.mode === 'edit' && modalState.category) {
            updateMutation.mutate({ id: modalState.category.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
        submitting={submitting}
        errorMessage={mutationError}
      />

      <ConfirmModal
        open={Boolean(confirmCategory)}
        onClose={closeConfirm}
        title="حذف التصنيف"
        message={confirmCategory ? `هل أنت متأكد من حذف التصنيف "${confirmCategory.name?.ar || confirmCategory.name?.en || confirmCategory.slug}"؟` : ''}
        confirmText={deleteMutation.isPending ? 'جارٍ الحذف...' : 'حذف'}
        danger
        onConfirm={() => {
          if (confirmCategory) {
            deleteMutation.mutate(confirmCategory.id);
          }
        }}
      />
    </AdminLayout>
  );
}
