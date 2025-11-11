import React, { useState } from 'react';

/**
 * FAQSection Component - Displays frequently asked questions
 */
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'كيف يمكنني تتبع طلبي؟',
      answer: 'يمكنك تتبع طلبك من خلال تسجيل الدخول إلى حسابك والذهاب إلى قسم "طلباتي" حيث ستجد تفاصيل التتبع والحالة الحالية للطلب.'
    },
    {
      id: 2,
      question: 'ما هي سياسة الإرجاع والاستبدال؟',
      answer: 'نوفر سياسة إرجاع واستبدال خلال 14 يوماً من تاريخ الاستلام. يجب أن يكون المنتج في حالته الأصلية مع وجود الفاتورة.'
    },
    {
      id: 3,
      question: 'هل التوصيل مجاني؟',
      answer: 'التوصيل مجاني للطلبات التي تزيد قيمتها عن 200 ريال. للطلبات الأقل من ذلك، يتم احتساب رسوم توصيل حسب المنطقة.'
    },
    {
      id: 4,
      question: 'ما هي طرق الدفع المتاحة؟',
      answer: 'نوفر عدة طرق دفع آمنة تشمل البطاقات الائتمانية، التحويل البنكي، والدفع عند الاستلام.'
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            الأسئلة الشائعة
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;