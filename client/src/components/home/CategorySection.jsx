import React from 'react';

/**
 * CategorySection Component - Displays product categories
 */
const CategorySection = () => {
  const categories = [
    { id: 1, name: 'إلكترونيات', icon: '📱', count: 150 },
    { id: 2, name: 'ملابس', icon: '👕', count: 200 },
    { id: 3, name: 'منزل ومطبخ', icon: '🏠', count: 120 },
    { id: 4, name: 'رياضة', icon: '⚽', count: 80 },
    { id: 5, name: 'كتب', icon: '📚', count: 300 },
    { id: 6, name: 'صحة وجمال', icon: '💄', count: 90 },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            الفئات الرئيسية
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            تصفح مجموعة واسعة من الفئات واعثر على ما تبحث عنه
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.count} منتج
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;