import React, { useState, useEffect } from "react";
import { 
  Package, 
  ImageIcon, 
  Tag, 
  DollarSign, 
  Box, 
  Upload, 
  X, 
  Layers,
  Info,
  Save,
  Sparkles
} from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/input";
import { Select } from "../../../ui/select";
import { useToast } from "../../../../contexts/ToastContext";

// Enhanced styling
const labelCls = 'block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100';
const textareaCls = `${inputCls} resize-none`;

// Section Panel component
const SectionPanel = ({ icon: Icon, title, children, color = "emerald" }) => {
  const colorClasses = {
    emerald: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50",
    blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50",
    purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50",
    amber: "from-amber-500 to-amber-600 text-amber-600 bg-amber-50"
  };
  
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 dark:border-slate-800">
        <div className={`rounded-lg p-2 ${colorClasses[color].split(' ').slice(2).join(' ')}`}>
          <Icon className={`h-5 w-5 ${colorClasses[color].split(' ')[2]}`} />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};


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

  const resolveText = (value) => {
    if (typeof value === 'string') return value;
    if (!value) return '';
    if (typeof value === 'object') {
      const locale = value?.ar ? 'ar' : value?.en ? 'en' : null;
      if (locale) return value[locale];
      const firstString = Object.values(value).find((entry) => typeof entry === 'string');
      if (firstString) return firstString;
    }
    return String(value || '');
  };

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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-xl mb-6">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {product ? "قم بتحديث بيانات المنتج" : "أدخل بيانات المنتج الجديد"}
                </p>
              </div>
            </div>
            {onCancel && (
              <Button 
                variant="ghost" 
                onClick={onCancel} 
                size="icon"
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <Sparkles className="absolute top-4 left-4 h-8 w-8 text-white/20" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          <Info className="h-5 w-5 flex-shrink-0" />
          <div>
            <strong className="font-semibold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ----- Primary Column ----- */}
        <div className="lg:col-span-2 space-y-6">
          <SectionPanel icon={Package} title="معلومات المنتج الأساسية" color="emerald">
            <div className="space-y-5">
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
                  placeholder="أدخل وصفًا تفصيليًا للمنتج يوضح مميزاته وفوائده..."
                  rows={6}
                  className={textareaCls}
                />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel icon={ImageIcon} title="صور المنتج" color="blue">
            <div 
              className="border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-xl p-8 text-center transition-colors cursor-pointer group"
              onClick={() => document.getElementById('product-images').click()}
            >
              <input
                id="product-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-4 group-hover:bg-emerald-200 transition-colors">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">اضغط لرفع الصور</p>
                  <p className="text-sm text-slate-500 mt-1">أو اسحب الصور وأفلتها هنا</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">PNG, JPG, WEBP • حتى 10MB لكل صورة</p>
              </div>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img 
                      src={preview} 
                      alt={`Preview ${index}`} 
                      className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-100" 
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                        الرئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel icon={Tag} title="التصنيف والعلامة التجارية" color="purple">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <option key={cat.id ?? cat._id ?? cat.value} value={cat.id ?? cat._id ?? cat.value}>
                      {resolveText(cat.name || cat.label || cat.title)}
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
              <div className="md:col-span-2">
                <label htmlFor="product-tags" className={labelCls}>علامات المنتج</label>
                <Input
                  id="product-tags"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="علامة1، علامة2، علامة3"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-1.5">افصل بين العلامات بفاصلة</p>
              </div>
            </div>
          </SectionPanel>
        </div>

        {/* ----- Secondary Column ----- */}
        <div className="space-y-6">
          <SectionPanel icon={DollarSign} title="التسعير والمخزون" color="amber">
            <div className="space-y-4">
              <div>
                <label htmlFor="product-price" className={labelCls}>السعر (ر.س) *</label>
                <div className="relative">
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0.00"
                    required
                    className={`${inputCls} pl-12`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ر.س</span>
                </div>
              </div>
              <div>
                <label htmlFor="product-sku" className={labelCls}>رمز SKU</label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="ABC-123"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <label htmlFor="product-min-stock" className={labelCls}>حد التنبيه</label>
                  <Input
                    id="product-min-stock"
                    type="number"
                    value={form.minStock}
                    onChange={(e) => handleChange("minStock", e.target.value)}
                    placeholder="5"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel icon={Box} title="الأبعاد والوزن" color="blue">
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
              <div>
                <label className={labelCls}>الأبعاد (سم)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    id="product-length"
                    type="number"
                    step="0.01"
                    value={form.dimensions.length}
                    onChange={(e) => handleDimensionChange("length", e.target.value)}
                    placeholder="الطول"
                    className={inputCls}
                  />
                  <Input
                    id="product-width"
                    type="number"
                    step="0.01"
                    value={form.dimensions.width}
                    onChange={(e) => handleDimensionChange("width", e.target.value)}
                    placeholder="العرض"
                    className={inputCls}
                  />
                  <Input
                    id="product-height"
                    type="number"
                    step="0.01"
                    value={form.dimensions.height}
                    onChange={(e) => handleDimensionChange("height", e.target.value)}
                    placeholder="الارتفاع"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel icon={Layers} title="حالة المنتج" color="emerald">
            <div className="space-y-3">
              {[
                { value: 'active', label: 'نشط', desc: 'متاح للبيع', color: 'emerald' },
                { value: 'draft', label: 'مسودة', desc: 'غير منشور', color: 'amber' },
                { value: 'archived', label: 'مؤرشف', desc: 'مخفي من المتجر', color: 'slate' }
              ].map((status) => (
                <label
                  key={status.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.status === status.value
                      ? `border-${status.color}-500 bg-${status.color}-50`
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={form.status === status.value}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    form.status === status.value ? `border-${status.color}-500` : 'border-slate-300'
                  }`}>
                    {form.status === status.value && (
                      <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{status.label}</p>
                    <p className="text-xs text-slate-500">{status.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </SectionPanel>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
          <Button 
            type="submit" 
            disabled={loading} 
            className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all"
          >
            <Save className="h-5 w-5" />
            {loading ? "جاري الحفظ..." : product ? "تحديث المنتج" : "حفظ المنتج"}
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
              className="px-6 py-3 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              إلغاء
            </Button>
          )}
        </div>
      )}
    </form>
  );
};

export default ProductForm;
