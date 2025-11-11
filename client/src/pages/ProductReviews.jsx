import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { Star, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import api from '../services/api/client';
import { useAuth } from '../stores/AuthContext';

const ProductReviews = () => {
  const { t } = useTranslation();
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reviews', productId, sortBy, page],
    queryFn: async () => {
      const response = await api.get(`/reviews/product/${productId}/enhanced`, {
        params: { sort: sortBy, page, limit: 10 }
      });
      return response.data;
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortBy);
    params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [sortBy, page, setSearchParams]);

  const handleVote = (reviewId, helpful) => {
    // Update local state optimistically
    refetch();
  };

  const handleRespond = (reviewId) => {
    refetch();
  };

  const handleReviewSubmit = () => {
    setShowForm(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('common.error')}
          </h2>
          <p className="text-gray-600">
            {t('reviews.loadError')}
          </p>
        </div>
      </div>
    );
  }

  const { reviews, pagination, ratingDistribution } = data?.data || {};
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('reviews.title')}
          </h1>
          <p className="text-gray-600">
            {t('reviews.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              {/* Rating Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('reviews.ratingSummary')}
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('reviews.basedOn', { count: totalReviews })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {t('reviews.ratingBreakdown')}
                </h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingDistribution?.[rating] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 w-8">
                          {rating} ★
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Button */}
              {user && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('reviews.writeReview')}
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {t('reviews.sortBy')}
                  </span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">{t('reviews.sort.newest')}</option>
                  <option value="oldest">{t('reviews.sort.oldest')}</option>
                  <option value="highest">{t('reviews.sort.highest')}</option>
                  <option value="lowest">{t('reviews.sort.lowest')}</option>
                  <option value="helpful">{t('reviews.sort.helpful')}</option>
                </select>
              </div>
            </div>

            {/* Review Form */}
            {showForm && (
              <ReviewForm
                productId={productId}
                onSuccess={handleReviewSubmit}
              />
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews?.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onVote={handleVote}
                    onRespond={handleRespond}
                    isAdmin={user?.role === 'admin'}
                  />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('reviews.noReviews')}
                  </h3>
                  <p className="text-gray-600">
                    {t('reviews.beFirst')}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous')}
                </button>
                <span className="px-3 py-2 text-gray-700">
                  {t('common.pageOf', { current: page, total: pagination.pages })}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;