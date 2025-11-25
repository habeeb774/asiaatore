import React, { useState, useEffect } from "react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/input";
import { Select } from "../../../ui/select";
import Panel from "../../../ui/Panel";
import { useToast } from "../../../../contexts/ToastContext";

// Consistent styling for form elements
const labelCls = 'block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400';
const inputCls = 'w-full rounded-lg border-gray-200 bg-white/70 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-100';
const textareaCls = `${inputCls} p-3`;


const ProductForm = ({
  product,
  categories,
  onSubmit,
  onCancel,
  showHeader = true,
  showActions = true,
}) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    sku: "",
    stock: "",
    minStock: "",
    status: "active",
    images: [],
    tags: "",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const [imagePreviews, setImagePreviews] = useState([]); // For previewing images

  useEffect(() => {
    // Cleanup object URLs to avoid memory leaks
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.categoryId || "",
        brand: product.brand || "",
        sku: product.sku || "",
        stock: product.stock || "",
        minStock: product.minStock || "",
        status: product.status || "active",
        images: product.images || [],
        tags: product.tags ? product.tags.join(", ") : "",
        weight: product.weight || "",
        dimensions: {
          length: product.dimensions?.length || "",
          width: product.dimensions?.width || "",
          height: product.dimensions?.height || "",
        },
      });
       // If product images are URLs (strings), use them for preview
      if (product.images && product.images.length > 0 && typeof product.images[0] === 'string') {
        setImagePreviews(product.images);
      }
    }
  }, [product]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [field]: value },
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    handleChange("images", [...form.images, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...form.images];
    const newPreviews = [...imagePreviews];

    // Revoke the specific object URL before removing it
    const previewToRemove = newPreviews[index];
    if (previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    handleChange("images", newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // NOTE: The actual file upload logic needs to happen in the onSubmit function.
      // This component only passes the File objects.
      // If you are using something like FormData, you'd append the files there.
      const formData = {
        ...form,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 0,
        weight: parseFloat(form.weight) || 0,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        dimensions: {
          length: parseFloat(form.dimensions.length) || 0,
          width: parseFloat(form.dimensions.width) || 0,
          height: parseFloat(form.dimensions.height) || 0,
        },
      };

      await onSubmit(formData);
      toast.success(
        product ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح"
      );

      if (!product) {
        setForm({
          name: "",
          description: "",
          price: "",
          category: "",
          brand: "",
          sku: "",
          stock: "",
          minStock: "",
          status: "active",
          images: [],
          tags: "",
          weight: "",
          dimensions: { length: "", width: "", height: "" },
        });
        setImagePreviews([]);
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ المنتج");
      toast.error("فشل حفظ المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h2>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">خطأ!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ----- Primary Column ----- */}
        <div className="lg:col-span-2 space-y-6">
          <Panel>
            <div className="space-y-4">
              <div>
                <label htmlFor="product-name" className={labelCls}>اسم المنتج *</label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="مثال: قميص قطني عالي الجودة"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="product-description" className={labelCls}>وصف المنتج</label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="أدخل وصفًا تفصيليًا للمنتج..."
                  rows={8}
                  className={textareaCls}
                />
              </div>
            </div>
          </Panel>

           <Panel>
            <h3 className="text-lg font-semibold mb-4">صور المنتج</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                id="product-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="product-images" className="cursor-pointer text-blue-500 hover:text-blue-600 font-medium">
                ارفع صورًا أو اسحبها وأفلتها هنا
              </label>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
            </div>
             {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-lg shadow-md" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
             <h3 className="text-lg font-semibold mb-4">التصنيف والعلامة التجارية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="product-category" className={labelCls}>الفئة *</label>
                <Select
                  id="product-category"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">اختر الفئة</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="product-brand" className={labelCls}>العلامة التجارية</label>
                <Input
                  id="product-brand"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="مثال: نايكي"
                  className={inputCls}
                />
              </div>
               <div>
                <label htmlFor="product-tags" className={labelCls}>علامات المنتج</label>
                <Input
                  id="product-tags"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="علامة1، علامة2، علامة3"
                  className={inputCls}
                />
                <small className="text-gray-500 dark:text-gray-400 mt-1 block">افصل بين العلامات بفاصلة</small>
              </div>
            </div>
          </Panel>
        </div>

        {/* ----- Secondary Column ----- */}
        <div className="space-y-6">
          <Panel>
             <h3 className="text-lg font-semibold mb-4">التسعير والمخزون</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="product-price" className={labelCls}>السعر *</label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="product-sku" className={labelCls}>SKU</label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="رمز المنتج الفريد"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-stock" className={labelCls}>المخزون</label>
                  <Input
                    id="product-stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="product-min-stock" className={labelCls}>حد أدنى</label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    value={form.minStock}
                    onChange={(e) => handleChange("minStock", e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </Panel>
          <Panel>
            <h3 className="text-lg font-semibold mb-4">المواصفات</h3>
            <div className="space-y-4">
               <div>
                  <label htmlFor="product-weight" className={labelCls}>الوزن (كجم)</label>
                  <Input
                    id="product-weight"
                    type="number"
                    step="0.01"
                    value={form.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="product-length" className={labelCls}>الطول</label>
                  <Input
                    id="product-length"
                    type="number"
                    step="0.01"
                    value={form.dimensions.length}
                    onChange={(e) => handleDimensionChange("length", e.target.value)}
                    placeholder="سم"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="product-width" className={labelCls}>العرض</label>
                  <Input
                    id="product-width"
                    type="number"
                    step="0.01"
                    value={form.dimensions.width}
                    onChange={(e) => handleDimensionChange("width", e.target.value)}
                    placeholder="سم"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="product-height" className={labelCls}>الارتفاع</label>
                  <Input
                    id="product-height"
                    type="number"
                    step="0.01"
                    value={form.dimensions.height}
                    onChange={(e) => handleDimensionChange("height", e.target.value)}
                    placeholder="سم"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </Panel>
           <Panel>
            <h3 className="text-lg font-semibold mb-4">الحالة</h3>
            <Select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className={inputCls}
            >
              <option value="active">نشط</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </Select>
          </Panel>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? "جاري الحفظ..." : product ? "تحديث المنتج" : "إضافة المنتج"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
          )}
        </div>
      )}
    </form>
  );
};

export default ProductForm;
