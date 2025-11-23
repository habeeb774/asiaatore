import React, { useState } from 'react';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../../contexts/ToastContext';

const mockUploadImage = async (file, productId) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: Math.random().toString(36).substring(2),
    url: URL.createObjectURL(file),
    alt: file.name,
    productId
  };
};

const ProductImagesManager = ({ product, onChange, onDelete, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const toast = useToast();

  if (!product) {
    return null;
  }

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length) {
      toast.error('يرجى اختيار صور بتنسيق JPG أو PNG أو WEBP');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const largeFiles = files.filter(file => file.size > maxSize);

    if (largeFiles.length) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    setUploading(true);

    try {
      const uploadedImages = await Promise.all(
        selectedFiles.map(file => mockUploadImage(file, product.id))
      );

      const nextImages = [
        ...(product.images || []),
        ...uploadedImages
      ];

      if (typeof onChange === 'function') {
        await onChange(nextImages);
      }
      setSelectedFiles([]);
      toast.success('تم رفع الصور بنجاح');
    } catch {
      toast.error('فشل رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (imageId) => {
    const nextImages = (product.images || []).filter(img => img.id !== imageId);
    if (typeof onChange === 'function') {
      await onChange(nextImages);
    }

    if (onDelete) {
      try {
        await onDelete(imageId);
      } catch {
        toast.error('فشل حذف الصورة');
      }
    }
  };

  return (
    <div className="product-images-manager">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">إدارة صور المنتج</h3>
          <p className="text-sm text-gray-600">{product.name}</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">صور المنتج</h3>
          <p className="text-sm text-gray-600 mb-4">
            قم بإضافة صور عالية الجودة لعرض منتجك بشكل احترافي
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block">
                <span className="sr-only">اختر صور المنتج</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="product-images-input"
                />
                <label
                  htmlFor="product-images-input"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <span className="text-3xl">📷</span>
                  <span className="font-medium">انقر لاختيار الصور</span>
                  <span className="text-sm text-gray-500">
                    يمكنك اختيار أكثر من صورة (JPG, PNG, WEBP)
                  </span>
                </label>
              </label>
            </div>

            <div className="sm:w-48">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>صور حالية</span>
                  <span>{product.images?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>صور جديدة</span>
                  <span>{selectedFiles.length}</span>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFiles.length || uploading}
                className="mt-4 w-full"
              >
                {uploading ? 'جاري الرفع...' : 'رفع الصور المختارة'}
              </Button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">صور جاهزة للرفع:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border group">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm">{file.name}</span>
                    </div>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">معرض الصور</h3>

          {product.images?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map(image => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square overflow-hidden rounded-lg border">
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(image.id)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-white/90 text-red-600 px-3 py-1 rounded-full text-xs font-medium shadow"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <span className="text-4xl mb-2 block">🖼️</span>
              <p>لا توجد صور للمنتج حتى الآن</p>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-medium mb-2">نصائح للصور:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• استخدم صور بدقة عالية (يفضل 1080×1080 بكسل فما فوق)</li>
              <li>• حافظ على خلفية نظيفة وواضحة للمنتج</li>
              <li>• قم بإضافة صور تُظهر تفاصيل المنتج من عدة زوايا</li>
              <li>• استخدم صور أقل من 5 ميجابايت لتسريع التحميل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesManager;
