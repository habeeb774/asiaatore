import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';

const Contact = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'الهاتف',
      details: '+966 50 123 4567',
      description: 'متاح من 8 صباحاً إلى 10 مساءً'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'البريد الإلكتروني',
      details: 'info@manfa-asia.com',
      description: 'رد خلال 24 ساعة'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'المقر الرئيسي',
      details: 'الرياض، المملكة العربية السعودية',
      description: 'المملكة العربية السعودية'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'ساعات العمل',
      details: 'الأحد - الخميس',
      description: '8:00 ص - 10:00 م'
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    // معالجة إرسال النموذج هنا
    console.log('Form submitted:', formData);
    // إعادة تعيين النموذج
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <Seo title={(locale==='ar'? 'اتصل بنا' : 'Contact') + ' | ' + siteName} description={locale==='ar' ? `تواصل مع ${siteName}` : `Contact ${siteName}`} />
      <div className="container-custom px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            اتصل بنا
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            نحن هنا لمساعدتك! تواصل معنا لأي استفسارات أو طلبات خاصة
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* معلومات الاتصال */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-8">معلومات التواصل</h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4 space-x-reverse p-4 bg-white rounded-xl shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="text-primary-red p-2 bg-red-50 rounded-lg">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{info.title}</h3>
                      <p className="text-gray-800 font-medium">{info.details}</p>
                      <p className="text-gray-600 text-sm">{info.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* الخريطة */}
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">موقعنا على الخريطة</h3>
                <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                  <p className="text-gray-500">خريطة تفاعلية ستظهر هنا</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* نموذج الاتصال */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6">أرسل رسالة</h2>
              <p className="text-gray-600 mb-8">
                سنكون سعداء بالرد على استفساراتك في أقرب وقت ممكن
              </p>

              {sent ? (
                <div className="text-green-600 mb-4">تم إرسال رسالتك. سنتواصل معك قريباً.</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">الاسم الكامل *</label>
                      <input
                        id="contact-name"
                        autoComplete="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">البريد الإلكتروني *</label>
                      <input
                        id="contact-email"
                        autoComplete="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">رقم الهاتف</label>
                      <input
                        id="contact-phone"
                        autoComplete="tel"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                        placeholder="+966 50 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الموضوع *</label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                      >
                        <option value="">اختر الموضوع</option>
                        <option value="استفسار عن منتج">استفسار عن منتج</option>
                        <option value="طلب خاص">طلب خاص</option>
                        <option value="شكوى">شكوى</option>
                        <option value="مقترح">مقترح</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">الرسالة *</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                      placeholder="أدخل رسالتك هنا..."
                    ></textarea>
                  </div>

                  {/** Motion-enabled Button (uses the shared Button primitive) */}
                  {(() => {
                    const MotionButton = motion(Button);
                    return (
                      <MotionButton
                        type="submit"
                        variant="primary"
                        className="w-full py-4 text-lg flex items-center justify-center space-x-2 space-x-reverse"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Send size={20} />
                        <span>إرسال الرسالة</span>
                      </MotionButton>
                    );
                  })()}
                </form>
              )}

            </motion.div>

            {/* الأسئلة الشائعة */}
            <motion.div
              className="mt-8 bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6">أسئلة متكررة</h2>
              <div className="space-y-4">
                {[
                  {
                    question: 'كم تستغرق مدة التوصيل؟',
                    answer: 'مدة التوصيل من 2-3 أيام عمل داخل الرياض، ومن 3-5 أيام لباقي المدن'
                  },
                  {
                    question: 'هل الشحن مجاني؟',
                    answer: 'نعم، الشحن مجاني لجميع الطلبات التي تزيد عن 500 ريال سعودي'
                  },
                  {
                    question: 'كيف يمكنني تتبع طلبي؟',
                    answer: 'سيتم إرسال رقم تتبع عبر البريد الإلكتروني بعد شحن الطلب'
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;