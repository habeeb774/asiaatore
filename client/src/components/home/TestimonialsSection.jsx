import React from 'react';

/**
 * TestimonialsSection Component - Displays customer testimonials
 */
const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'أحمد محمد',
      role: 'عميل',
      content: 'خدمة ممتازة وجودة عالية للمنتجات. توصيل سريع وتعامل ودود.',
      rating: 5,
      avatar: '👨'
    },
    {
      id: 2,
      name: 'فاطمة علي',
      role: 'عميلة',
      content: 'متجر رائع وأسعار تنافسية. دائماً ما أجد ما أبحث عنه هنا.',
      rating: 5,
      avatar: '👩'
    },
    {
      id: 3,
      name: 'محمد حسن',
      role: 'عميل',
      content: 'تجربة تسوق ممتعة وآمنة. شكراً للفريق على الخدمة المتميزة.',
      rating: 5,
      avatar: '👨‍💼'
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            آراء عملائنا
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            ماذا يقول عملاؤنا عن تجربتهم معنا
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">{testimonial.avatar}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>

              <p className="text-gray-600 dark:text-gray-300 italic">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;