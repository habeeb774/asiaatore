import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from '../lib/framerLazy';
import { Check, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api/client';
import { useAuth } from '../stores/AuthContext';
import { useToast } from '../stores/ToastContext';

const SubscriptionPlans = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/api/subscriptions/plans').then(res => res.data.data)
  });

  const { data: currentSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => api.get('/api/subscriptions/current').then(res => res.data.data),
    enabled: !!user
  });

  const handleSubscribe = async (planId) => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await api.post(`/api/subscriptions/subscribe/${planId}`);
      toast.success(response.data.message);
      refetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancel = async () => {
    setIsSubscribing(true);
    try {
      const response = await api.post('/api/subscriptions/cancel');
      toast.success(response.data.message);
      refetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setIsSubscribing(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            {t('subscriptions.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            {t('subscriptions.subtitle')}
          </motion.p>
        </div>

        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('subscriptions.currentPlan')}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentSubscription.plan.name} - {currentSubscription.status}
                </p>
                <p className="text-sm text-gray-500">
                  {t('subscriptions.validUntil')}: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={isSubscribing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubscribing ? t('common.loading') : t('subscriptions.cancel')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans?.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.nameEn === 'Premium' ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.nameEn === 'Premium' && (
                <div className="bg-primary text-white text-center py-2">
                  <Star className="w-5 h-5 inline mr-1" />
                  {t('subscriptions.mostPopular')}
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {plan.currency}/{t(`subscriptions.interval.${plan.interval}`)}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {feature.name}
                        {feature.value && (
                          <span className="font-semibold">: {feature.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isSubscribing || currentSubscription?.status === 'active'}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.nameEn === 'Premium'
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currentSubscription?.status === 'active'
                    ? t('subscriptions.alreadySubscribed')
                    : isSubscribing
                    ? t('common.loading')
                    : t('subscriptions.subscribe')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            {t('subscriptions.questions')}
          </p>
          <a
            href="/support"
            className="text-primary hover:text-primary-dark font-semibold"
          >
            {t('subscriptions.contactSupport')}
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;