import React, { useState } from 'react';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../../contexts/ToastContext';

const ExcelActions = ({ products = [], categories = [], onImport, onExport }) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.xlsx$/i) && !file.name.match(/\.xls$/i)) {
      setError('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف يجب ألا يتجاوز 10 ميجابايت');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      if (typeof onImport === 'function') {
        await onImport(file);
      }
      toast.success('تم استيراد المنتجات من Excel بنجاح');
      event.target.value = '';
    } catch (err) {
      const message = err?.message || 'فشل استيراد المنتجات';
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    if (typeof onExport !== 'function') return;

    setExporting(true);
    setError(null);

    try {
      const blob = await onExport();
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success('تم تصدير المنتجات إلى Excel بنجاح');
    } catch (err) {
      const message = err?.message || 'فشل تصدير المنتجات';
      setError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (productsList, categoriesList) => {
    const headers = [
      'اسم المنتج',
      'الوصف',
      'السعر',
      'الفئة',
      'العلامة التجارية',
      'SKU',
      'المخزون',
      'الحالة',
      'الوزن',
      'الأبعاد'
    ];

    const rows = productsList?.map(product => {
      const category = categoriesList?.find(cat => cat.id === product.categoryId);
      return [
        product.name || '',
        product.description || '',
        product.price || 0,
        category?.name || '',
        product.brand || '',
        product.sku || '',
        product.stock || 0,
        product.status || '',
        product.weight || '',
        product.dimensions ? `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}` : ''
      ];
    }) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'اسم المنتج مثال',
        description: 'وصف المنتج هنا',
        price: 99.99,
        categoryId: categories?.[0]?.id || 'category-id',
        brand: 'العلامة التجارية',
        sku: 'EXAMPLE001',
        stock: 100,
        status: 'active',
        weight: 1.5,
        dimensions: { length: 10, width: 8, height: 5 }
      }
    ];

    const csvContent = generateCSV(templateData, categories);
    downloadFile(csvContent, 'products_template.csv', 'text/csv');
    toast.success('تم تحميل قالب الاستيراد');
  };

  return (
    <div className="excel-actions">
      <div className="actions-header mb-6">
        <h3>استيراد وتصدير المنتجات</h3>
        <p className="text-gray-600">استخدم Excel لاستيراد أو تصدير المنتجات بشكل مجمع</p>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="actions-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="import-section p-6 border rounded-lg">
          <h4 className="font-medium mb-4">استيراد المنتجات</h4>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="excel-import"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                disabled={importing}
                className="hidden"
              />
              <label
                htmlFor="excel-import"
                className="cursor-pointer inline-block"
              >
                <div className="text-gray-600">
                  <div className="text-4xl mb-2">📊</div>
                  <p>اسحب وأفلت ملف Excel هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500 mt-1">
                    يدعم .xlsx و .xls - الحد الأقصى 10 ميجابايت
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={importing}
                  className="mt-4"
                >
                  {importing ? 'جاري الاستيراد...' : 'اختر ملف Excel'}
                </Button>
              </label>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                تحميل قالب الاستيراد
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                قم بتحميل القالب لمعرفة التنسيق المطلوب
              </p>
            </div>
          </div>
        </div>

        <div className="export-section p-6 border rounded-lg">
          <h4 className="font-medium mb-4">تصدير المنتجات</h4>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">عدد المنتجات</span>
                <span className="text-sm text-gray-600">{products?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">عدد الفئات</span>
                <span className="text-sm text-gray-600">{categories?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">تنسيق التصدير</span>
                <span className="text-sm text-gray-600">CSV</span>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting || !products?.length}
              className="w-full"
            >
              {exporting ? 'جاري التصدير...' : 'تصدير المنتجات'}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• سيتم تصدير جميع المنتجات مع جميع التفاصيل</p>
              <p>• الملف سيكون بتنسيق CSV لسهولة الفتح في Excel</p>
              <p>• يتضمن اسم الفئة بدلاً من المعرف</p>
            </div>
          </div>
        </div>
      </div>

      <div className="guidelines mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">إرشادات الاستخدام:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-2">للاستيراد:</h5>
            <ul className="space-y-1">
              <li>• استخدم قالب الاستيراد لضمان التنسيق الصحيح</li>
              <li>• تأكد من أن الفئات موجودة في النظام</li>
              <li>• SKU يجب أن يكون فريداً لكل منتج</li>
              <li>• السعر والمخزون يجب أن تكون أرقام</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">للتصدير:</h5>
            <ul className="space-y-1">
              <li>• يمكنك تعديل الملف المصدر وإعادة استيراده</li>
              <li>• يحتفظ بالتنسيق العربي بشكل صحيح</li>
              <li>• يمكن فتحه في أي برنامج جداول إلكترونية</li>
              <li>• الأبعاد تظهر كـ (طول×عرض×ارتفاع)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelActions;
