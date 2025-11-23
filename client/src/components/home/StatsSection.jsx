import React from 'react';

/**
 * StatsSection Component - Displays store statistics
 */
const StatsSection = () => {
  const stats = [
    { id: 1, label: 'منتج', value: '10,000+', icon: '📦' },
    { id: 2, label: 'عميل راضي', value: '50,000+', icon: '😊' },
    { id: 3, label: 'طلب يومي', value: '500+', icon: '📈' },
    { id: 4, label: 'سنة خبرة', value: '5+', icon: '🏆' },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-emerald-600 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            إحصائياتنا
          </h2>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            ثقة آلاف العملاء بنا على مدار السنوات
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-emerald-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
