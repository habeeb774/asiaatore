import React, { useMemo, useState } from 'react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/input';
import { useToast } from '../../../../contexts/ToastContext';

const ProductTierManager = ({ product, tiers = [], onChange, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formState, setFormState] = useState({
    minQuantity: '',
    price: ''
  });
  const toast = useToast();

  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  }, [tiers]);

  const validateTier = ({ minQuantity, price }) => {
    if (!minQuantity || Number(minQuantity) <= 0) {
      toast.error('الكمية الدنيا يجب أن تكون أكبر من صفر');
      return false;
    }

    if (!price || Number(price) <= 0) {
      toast.error('السعر يجب أن يكون أكبر من صفر');
      return false;
    }

    if (sortedTiers.some(tier => Number(tier.minQuantity) === Number(minQuantity))) {
      toast.error('يوجد مستوى تسعير بنفس الكمية الدنيا');
      return false;
    }

    return true;
  };

  const handleAddTier = () => {
    if (!validateTier(formState)) {
      return;
    }

    const newTier = {
      id: Math.random().toString(36).substring(2, 9),
      minQuantity: Number(formState.minQuantity),
      price: Number(formState.price)
    };

    const updatedTiers = [...sortedTiers, newTier].sort((a, b) => a.minQuantity - b.minQuantity);
    onChange(updatedTiers);

    setFormState({ minQuantity: '', price: '' });
    setIsAdding(false);
    toast.success('تمت إضافة مستوى تسعير جديد');
  };

  const handleRemoveTier = (tierId) => {
    const updatedTiers = sortedTiers.filter(tier => tier.id !== tierId);
    onChange(updatedTiers);
    toast.success('تم حذف مستوى التسعير');
  };

  const handleEditTier = (tierId, field, value) => {
    const updatedTiers = sortedTiers.map(tier => {
      if (tier.id === tierId) {
        return { ...tier, [field]: Number(value) };
      }
      return tier;
    });
    onChange(updatedTiers);
  };

  return (
    <div className="product-tier-manager">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">مستويات التسعير بالجملة</h3>
            <p className="text-sm text-gray-600">
              {product?.name ? `المنتج: ${product.name}` : 'أضف مستويات تسعير خاصة بالطلبات الكبيرة لتقديم خصومات تلقائية'}
            </p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {typeof product?.price === 'number' && (
            <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-lg p-4">
              <p className="font-medium">السعر الأساسي: {product.price.toFixed(2)} ر.س</p>
              <p className="text-sm mt-1">استخدم مستويات التسعير لتقديم خصومات عند شراء كميات أكبر</p>
            </div>
          )}

          {sortedTiers.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              لا توجد مستويات تسعير حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTiers.map(tier => (
                <div
                  key={tier.id}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center border rounded-lg p-3"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحد الأدنى للكمية
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={tier.minQuantity}
                      onChange={event => handleEditTier(tier.id, 'minQuantity', event.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر لكل وحدة
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.price}
                      onChange={event => handleEditTier(tier.id, 'price', event.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveTier(tier.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
              إضافة مستوى تسعير جديد
            </Button>
          )}

          {isAdding && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">إضافة مستوى جديد</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحد الأدنى للكمية
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formState.minQuantity}
                    onChange={event => setFormState(prev => ({
                      ...prev,
                      minQuantity: event.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر لكل وحدة
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={event => setFormState(prev => ({
                      ...prev,
                      price: event.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setFormState({ minQuantity: '', price: '' });
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={handleAddTier}>
                  حفظ المستوى
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium">نصائح لتسعير الجملة:</p>
        <ul className="mt-2 space-y-1">
          <li>• ابدأ بتقديم خصومات صغيرة عند شراء 10 قطع فأكثر</li>
          <li>• زد الخصم تدريجيًا مع زيادة الكمية</li>
          <li>• استخدم مستويات مختلفة لكل نوع من المنتجات حسب هامش الربح</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductTierManager;
