import React, { useState, useEffect } from "react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/input";
import { Select } from "../../../ui/select";
import { useToast } from "../../../../contexts/ToastContext";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ المنتج");
      toast.error("فشل حفظ المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      {showHeader && (
        <div className="form-header">
          <h3>{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
        </div>
      )}

      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <h4>معلومات أساسية</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                اسم المنتج *
              </label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <Input
                value={form.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="رمز المنتج"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">وصف المنتج</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="أدخل وصف المنتج"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="form-section">
          <h4>التسعير والمخزون</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">السعر *</label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                المخزون الحالي
              </label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                الحد الأدنى للمخزون
              </label>
              <Input
                type="number"
                value={form.minStock}
                onChange={(e) => handleChange("minStock", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>التصنيف والعلامة التجارية</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الفئة *</label>
              <Select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                required
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
              <label className="block text-sm font-medium mb-1">
                العلامة التجارية
              </label>
              <Input
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="أدخل العلامة التجارية"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>المواصفات الفيزيائية</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                الوزن (كجم)
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                الطول (سم)
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.dimensions.length}
                onChange={(e) =>
                  handleDimensionChange("length", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                العرض (سم)
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.dimensions.width}
                onChange={(e) => handleDimensionChange("width", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                الارتفاع (سم)
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.dimensions.height}
                onChange={(e) =>
                  handleDimensionChange("height", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>العلامات</h4>
          <div>
            <label className="block text-sm font-medium mb-1">
              علامات المنتج
            </label>
            <Input
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="علامة1، علامة2، علامة3"
            />
            <small className="text-gray-500">افصل بين العلامات بفاصلة</small>
          </div>
        </div>

        <div className="form-section">
          <h4>الحالة</h4>
          <div>
            <label className="block text-sm font-medium mb-1">
              حالة المنتج
            </label>
            <Select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </Select>
          </div>
        </div>

        {showActions && (
          <div className="form-actions flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading
                ? "جاري الحفظ..."
                : product
                ? "تحديث المنتج"
                : "إضافة المنتج"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                إلغاء
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductForm;
