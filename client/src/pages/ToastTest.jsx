import React from 'react';
import { useToast } from '../stores/ToastContext';

export default function ToastTestPage() {
  const toast = useToast();

  const testSuccess = () => {
    toast.success('تم بنجاح!', 'العملية تمت بنجاح');
  };

  const testError = () => {
    toast.error('حدث خطأ', 'فشلت العملية في التنفيذ');
  };

  const testInfo = () => {
    toast.info('معلومة مهمة', 'هذه معلومة تحتاج إلى انتباهك');
  };

  const testWarning = () => {
    toast.warn('تحذير', 'هناك شيء يحتاج إلى انتباهك');
  };

  const testWithAction = () => {
    toast.success('تم الحفظ', 'تم حفظ البيانات بنجاح', 5000, {
      action: {
        label: 'عرض التفاصيل',
        onClick: () => alert('تم النقر على عرض التفاصيل')
      }
    });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">اختبار رسائل التوست</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={testSuccess}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          اختبار نجاح
        </button>

        <button
          onClick={testError}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          اختبار خطأ
        </button>

        <button
          onClick={testInfo}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          اختبار معلومات
        </button>

        <button
          onClick={testWarning}
          className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          اختبار تحذير
        </button>

        <button
          onClick={testWithAction}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors col-span-full"
        >
          اختبار مع زر إجراء
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">تعليمات الاختبار:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>اضغط على الأزرار المختلفة لرؤية أنواع التوست المختلفة</li>
          <li>جرب التوست مع الزر الإجرائي لترى كيف يعمل</li>
          <li>تحقق من أن التوست تختفي تلقائياً بعد الوقت المحدد</li>
          <li>جرب النقر على التوست لإغلاقها يدوياً</li>
        </ul>
      </div>
    </div>
  );
}