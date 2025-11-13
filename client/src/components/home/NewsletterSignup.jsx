import React, { useState } from 'react';
import { motion } from '../../lib/framerLazy.js';
import { useLanguage } from '../../stores/LanguageContext';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

const NewsletterSignup = ({
  title,
  subtitle,
  placeholder,
  buttonText,
  className = '',
  variant = 'default'
}) => {
  const { locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage(locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage(locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }

    setStatus('loading');

    try {
      // Simulate API call - replace with actual newsletter signup API
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus('success');
      setMessage(locale === 'ar' ? 'تم الاشتراك بنجاح!' : 'Successfully subscribed!');
      setEmail('');

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);

    } catch (error) {
      setStatus('error');
      setMessage(locale === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again');
    }
  };

  const variants = {
    default: {
      background: 'bg-gradient-to-r from-blue-600 to-purple-600',
      textColor: 'text-white',
      inputBg: 'bg-white/10',
      inputBorder: 'border-white/20',
      buttonBg: 'bg-white',
      buttonText: 'text-blue-600'
    },
    dark: {
      background: 'bg-gray-900',
      textColor: 'text-white',
      inputBg: 'bg-gray-800',
      inputBorder: 'border-gray-700',
      buttonBg: 'bg-blue-600',
      buttonText: 'text-white'
    },
    light: {
      background: 'bg-gray-50',
      textColor: 'text-gray-900',
      inputBg: 'bg-white',
      inputBorder: 'border-gray-300',
      buttonBg: 'bg-blue-600',
      buttonText: 'text-white'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <section className={`newsletter-signup py-16 ${className}`}>
      <div className="container-fixed px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`relative overflow-hidden rounded-3xl ${currentVariant.background} shadow-2xl`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, transparent 50%)`
            }} />
          </div>

          <div className="relative z-10 px-6 py-12 md:px-12 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6"
              >
                <Mail className={`w-8 h-8 ${currentVariant.textColor}`} />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className={`text-3xl md:text-4xl font-bold ${currentVariant.textColor} mb-4`}
              >
                {title || (locale === 'ar' ? 'اشترك في نشرتنا البريدية' : 'Subscribe to Our Newsletter')}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className={`${currentVariant.textColor} opacity-90 text-lg mb-8 max-w-2xl mx-auto`}
              >
                {subtitle || (locale === 'ar'
                  ? 'احصل على أحدث العروض والمنتجات الجديدة مباشرة في بريدك الإلكتروني'
                  : 'Get the latest offers and new products directly in your email'
                )}
              </motion.p>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                onSubmit={handleSubmit}
                className="max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={placeholder || (locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email')}
                      className={`w-full px-6 py-4 rounded-full ${currentVariant.inputBg} ${currentVariant.inputBorder} border-2 ${currentVariant.textColor} placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 text-center sm:text-left`}
                      disabled={status === 'loading'}
                      aria-label={locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                    />

                    {/* Status Icon */}
                    {status === 'success' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </motion.div>
                    )}

                    {status === 'error' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </motion.div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={status === 'loading'}
                    className={`px-8 py-4 rounded-full ${currentVariant.buttonBg} ${currentVariant.buttonText} font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                  >
                    {status === 'loading' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : (
                      buttonText || (locale === 'ar' ? 'اشتراك' : 'Subscribe')
                    )}
                  </motion.button>
                </div>

                {/* Status Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 text-sm ${status === 'success' ? 'text-green-300' : 'text-red-300'}`}
                  >
                    {message}
                  </motion.div>
                )}
              </motion.form>

              {/* Additional Info */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className={`${currentVariant.textColor} opacity-70 text-sm mt-6`}
              >
                {locale === 'ar'
                  ? 'نحن نحترم خصوصيتك ولن نشارك بريدك الإلكتروني مع أي طرف ثالث'
                  : 'We respect your privacy and will never share your email with third parties'
                }
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSignup;