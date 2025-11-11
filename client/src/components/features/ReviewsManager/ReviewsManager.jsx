import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage, LocalizedText, DateDisplay } from '../../contexts/LanguageContext';
import { useNotifications } from '../../components/Notification/Notification';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import { Modal, ConfirmModal } from '../Modal';

const ReviewsManager = ({ productId, className = '' }) => {
  const { t, language } = useLanguage();
  const { success, error } = useNotifications();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: 'all', // all, 5, 4, 3, 2, 1
    status: 'all', // all, pending, approved, rejected
    sortBy: 'newest', // newest, oldest, rating_high, rating_low, helpful
    search: ''
  });

  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editData, setEditData] = useState({});

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        productId: productId || ''
      });

      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        error(t('failedToLoadReviews'));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      error(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [filters, productId, t, error]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      if (filters.search && !review.comment.toLowerCase().includes(filters.search.toLowerCase()) &&
          !review.customerName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [reviews, filters.search]);

  // Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;

    const averageRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: total > 0 ? (reviews.filter(r => r.rating === rating).length / total) * 100 : 0
    }));

    return {
      total,
      approved,
      pending,
      rejected,
      averageRating,
      ratingDistribution
    };
  }, [reviews]);

  // Handle review actions
  const handleReviewAction = async (reviewId, action) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        success(t(`${action}Success`));
        loadReviews();
      } else {
        error(t(`${action}Failed`));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedReviews.length === 0) return;

    try {
      const response = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          reviewIds: selectedReviews
        })
      });

      if (response.ok) {
        success(t('bulkActionCompleted'));
        setShowBulkModal(false);
        setSelectedReviews([]);
        setBulkAction('');
        loadReviews();
      } else {
        error(t('bulkActionFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Edit review
  const handleEditReview = async () => {
    if (!editingReview) return;

    try {
      const response = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        success(t('reviewUpdated'));
        setEditingReview(null);
        setEditData({});
        loadReviews();
      } else {
        error(t('updateFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
            className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="stats" />
        {[...Array(5)].map((_, i) => (
          <SkeletonLoader key={i} type="review" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${language.direction === 'rtl' ? 'rtl' : 'ltr'} ${className}`} dir={language.direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('reviewsManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageCustomerReviews', { count: stats.total })}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
          {selectedReviews.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {t('bulkActions')} ({selectedReviews.length})
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('totalReviews')}
          value={stats.total}
          icon="⭐"
          color="blue"
        />
        <StatCard
          title={t('approvedReviews')}
          value={stats.approved}
          icon="✅"
          color="green"
        />
        <StatCard
          title={t('pendingReviews')}
          value={stats.pending}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title={t('averageRating')}
          value={stats.averageRating.toFixed(1)}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Rating Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('ratingDistribution')}
        </h3>

        <div className="space-y-3">
          {stats.ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-[60px]">
                <span className="text-sm font-medium">{rating}</span>
                <span className="text-yellow-400">★</span>
              </div>

              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-left">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder={t('searchReviews')}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('allRatings')}</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="rejected">{t('rejected')}</option>
            </select>
          </div>

          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="newest">{t('newestFirst')}</option>
              <option value="oldest">{t('oldestFirst')}</option>
              <option value="rating_high">{t('highestRating')}</option>
              <option value="rating_low">{t('lowestRating')}</option>
              <option value="helpful">{t('mostHelpful')}</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
              onChange={(e) => {
                setSelectedReviews(e.target.checked ? filteredReviews.map(r => r.id) : []);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAll" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              {t('selectAll')}
            </label>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  checked={selectedReviews.includes(review.id)}
                  onChange={(e) => {
                    setSelectedReviews(prev =>
                      e.target.checked
                        ? [...prev, review.id]
                        : prev.filter(id => id !== review.id)
                    );
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                <LazyImage
                  src={review.customerAvatar}
                  alt={review.customerName}
                  className="w-12 h-12 rounded-full object-cover"
                  fallbackSrc="/default-avatar.png"
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {review.customerName}
                    </h4>
                    {renderStars(review.rating)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                      {t(review.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {review.comment}
                  </p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex space-x-2 rtl:space-x-reverse mb-3">
                      {review.images.map((image, index) => (
                        <LazyImage
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                          fallbackSrc="/placeholder-image.png"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                    <DateDisplay date={review.createdAt} />
                    {review.verified && (
                      <span className="flex items-center space-x-1 rtl:space-x-reverse">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t('verifiedPurchase')}</span>
                      </span>
                    )}
                    <span>{t('helpful')} ({review.helpfulCount || 0})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 rtl:space-x-reverse">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReviewAction(review.id, 'approve')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      {t('approve')}
                    </button>
                    <button
                      onClick={() => handleReviewAction(review.id, 'reject')}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      {t('reject')}
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setEditingReview(review);
                    setEditData({
                      rating: review.rating,
                      comment: review.comment,
                      status: review.status
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  {t('edit')}
                </button>

                <button
                  onClick={() => handleReviewAction(review.id, 'delete')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('noReviewsFound')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('tryAdjustingFilters')}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('bulkActions')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('action')}
            </label>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('selectAction')}</option>
              <option value="approve">{t('approveSelected')}</option>
              <option value="reject">{t('rejectSelected')}</option>
              <option value="delete">{t('deleteSelected')}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Review Modal */}
      <Modal
        isOpen={!!editingReview}
        onClose={() => {
          setEditingReview(null);
          setEditData({});
        }}
        title={t('editReview')}
      >
        {editingReview && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('rating')}
              </label>
              {renderStars(editData.rating || 0, true, (rating) => setEditData(prev => ({ ...prev, rating })))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('comment')}
              </label>
              <textarea
                value={editData.comment || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('status')}
              </label>
              <select
                value={editData.status || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="pending">{t('pending')}</option>
                <option value="approved">{t('approved')}</option>
                <option value="rejected">{t('rejected')}</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  setEditingReview(null);
                  setEditData({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleEditReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewsManager;