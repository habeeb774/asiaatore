import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, Upload } from 'lucide-react';
import Seo from '../../../components/Seo';
import { KpiCard } from '../../../components/features/admin/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useCategories } from '../hooks/useCategories';
import ProductsTable from '../../../components/features/admin/products/ProductsTable';
import { useToast } from '../../../contexts/ToastContext';

// Heavier admin product management components lazy-loaded to shrink initial admin bundle
const ProductForm = React.lazy(() => import('../../../components/features/admin/products/ProductForm'));
const ProductImagesManager = React.lazy(() => import('../../../components/features/admin/products/ProductImagesManager'));
const ProductTierManager = React.lazy(() => import('../../../components/features/admin/products/ProductTierManager'));
const ExcelActions = React.lazy(() => import('../../../components/features/admin/products/ExcelActions'));

const ProductsView = () => {
  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    importFromExcel,
    exportToExcel,
    refresh
  } = useAdminProducts();

  const { categories } = useCategories();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [panelProduct, setPanelProduct] = useState(null);
  const [panelType, setPanelType] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categoriesOptions = useMemo(() => categories || [], [categories]);
  const productsList = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const metrics = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;

    productsList.forEach((productItem) => {
      const stock = Number(productItem?.stock ?? 0);
      const minStock = Number(productItem?.minStock ?? 0);
      const price = Number(productItem?.price ?? 0);

      if (stock <= 0) {
        outOfStock += 1;
      }

      const hasConfiguredThreshold = minStock > 0;
      const threshold = hasConfiguredThreshold ? minStock : 5;
      if (stock > 0 && stock <= threshold) {
        lowStock += 1;
      }

      if (stock > 0 && price > 0) {
        inventoryValue += price * stock;
      }
    });

    return {
      total: productsList.length,
      active: productsList.filter((item) => item.status === 'active').length,
      draft: productsList.filter((item) => item.status === 'draft').length,
      lowStock,
      outOfStock,
      inventoryValue
    };
  }, [productsList]);

  // Lazy currency/number formatters to avoid constructing Intl instances in initial render
  const [fmt, setFmt] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    import('../../../utils/intlFormattersLazy').then(m => { if(mounted) setFmt(m); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);
  const numberFormatter = (value) => fmt ? fmt.formatNumber(value) : value;
  const currencyFormatter = (value) => fmt ? fmt.formatCurrency(value) : value;

  const kpiCards = useMemo(
    () => [
      {
        label: 'إجمالي المنتجات',
        value: numberFormatter(metrics.total)
      },
      {
        label: 'منتجات نشطة',
        value: numberFormatter(metrics.active),
        help: metrics.draft ? `${numberFormatter.format(metrics.draft)} مسودة بانتظار النشر` : undefined
      },
      {
        label: 'بحاجة لإعادة التوريد',
        value: numberFormatter(metrics.lowStock),
        help: metrics.outOfStock ? `${numberFormatter.format(metrics.outOfStock)} نفدت بالكامل` : undefined
      },
      {
        label: 'قيمة المخزون التقديرية',
        value: currencyFormatter(metrics.inventoryValue),
        help: 'السعر الحالي × الكمية المتوفرة'
      }
    ],
    [metrics, numberFormatter, currencyFormatter]
  );

  const openCreateModal = () => {
    setActiveProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setActiveProduct(product);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setActiveProduct(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (activeProduct) {
        const updated = await updateProduct(activeProduct.id, formData);
        setActiveProduct(updated);
      } else {
        await createProduct(formData);
      }
      closeFormModal();
      toast.success('تم حفظ المنتج بنجاح');
    } catch (submitError) {
      toast.error(submitError?.message || 'تعذر حفظ المنتج');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!product?.id) return;
    try {
      await deleteProduct(product.id);
      if (activeProduct?.id === product.id) {
        closeFormModal();
      }
    } catch (deleteError) {
      toast.error(deleteError?.message || 'تعذر حذف المنتج');
    }
  };

  const openPanel = (type, product) => {
    setPanelProduct(product);
    setPanelType(type);
  };

  const closePanel = () => {
    setPanelProduct(null);
    setPanelType(null);
  };

  const handleImagesChange = async (nextImages) => {
    if (!panelProduct?.id) return;
    try {
      const updated = await updateProduct(panelProduct.id, { images: nextImages });
      setPanelProduct(updated);
      if (activeProduct?.id === updated.id) {
        setActiveProduct(updated);
      }
    } catch (imagesError) {
      toast.error(imagesError?.message || 'تعذر تحديث صور المنتج');
    }
  };

  const handleTiersChange = async (nextTiers) => {
    if (!panelProduct?.id) return;
    try {
      const updated = await updateProduct(panelProduct.id, { tiers: nextTiers });
      setPanelProduct(updated);
      if (activeProduct?.id === updated.id) {
        setActiveProduct(updated);
      }
    } catch (tiersError) {
      toast.error(tiersError?.message || 'تعذر تحديث مستويات التسعير');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success('تم تحديث قائمة المنتجات');
    } catch (refreshError) {
      toast.error(refreshError?.message || 'تعذر تحديث قائمة المنتجات');
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickExport = async () => {
    setExporting(true);
    try {
      const file = await exportToExcel();
      if (!(file instanceof Blob)) {
        throw new Error('لم يتم إنشاء ملف التصدير');
      }
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('تم تصدير المنتجات بنجاح');
    } catch (exportError) {
      toast.error(exportError?.message || 'تعذر تصدير المنتجات');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Seo title="إدارة المنتجات" description="إدارة الكتالوج، المخزون، والاستيراد المجمع" />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>قائمة المنتجات ({productsList.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="mr-2">تحديث</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleQuickExport} disabled={exporting || !productsList.length}>
                <Upload className="h-4 w-4" />
                <span className="mr-2">تصدير سريع</span>
              </Button>
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                <span className="mr-2">إضافة منتج</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && !loading && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <ProductsTable
              products={productsList}
              loading={loading}
              categories={categoriesOptions}
              onEdit={openEditModal}
              onDelete={handleDeleteProduct}
              onManageImages={(product) => openPanel('images', product)}
              onManageTiers={(product) => openPanel('tiers', product)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الاستيراد والتصدير المتقدم</CardTitle>
          </CardHeader>
          <CardContent>
            <ExcelActions
              products={productsList}
              categories={categoriesOptions}
              onImport={importFromExcel}
              onExport={exportToExcel}
            />
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={closeFormModal}
        title={activeProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        size="xl"
      >
        <React.Suspense fallback={<div className="p-4 text-sm text-gray-500">جاري تحميل النموذج...</div>}>
          <ProductForm
            product={activeProduct}
            categories={categoriesOptions}
            onSubmit={handleFormSubmit}
            onCancel={closeFormModal}
            showHeader={false}
          />
        </React.Suspense>
      </Modal>

      {panelType === 'images' && panelProduct && (
        <React.Suspense fallback={<div className="p-4 text-sm text-gray-500">جاري تحميل إدارة الصور...</div>}>
          <ProductImagesManager
            product={panelProduct}
            onChange={handleImagesChange}
            onClose={closePanel}
          />
        </React.Suspense>
      )}

      {panelType === 'tiers' && panelProduct && (
        <React.Suspense fallback={<div className="p-4 text-sm text-gray-500">جاري تحميل إدارة مستويات التسعير...</div>}>
          <ProductTierManager
            product={panelProduct}
            tiers={panelProduct.tiers || []}
            onChange={handleTiersChange}
            onClose={closePanel}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default ProductsView;
