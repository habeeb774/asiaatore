import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage, LocalizedText, DateDisplay } from '../../contexts/LanguageContext';
import { useNotifications } from '../../components/Notification/Notification';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import { Modal } from '../Modal/Modal';

const CustomerReviews = ({
  productId,
  className = '',
  showWriteReview = true,
  showFilters = true,
  maxReviews = null
}) => {
  const { t, language } = useLanguage();
  const { success, error } = useNotifications();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
    images: []
  });
  const [filters, setFilters] = useState({
    rating: 'all',
    sortBy: 'newest',
    verifiedOnly: false
  });

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        productId: productId || ''
      });

      const response = await fetch(`/api/reviews?${params}`);
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
    let filtered = reviews;

    if (filters.rating !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(filters.rating));
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter(r => r.verified);
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        case 'helpful':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return maxReviews ? filtered.slice(0, maxReviews) : filtered;
  }, [reviews, filters, maxReviews]);

  // Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
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
      averageRating,
      ratingDistribution
    };
  }, [reviews]);

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (reviewForm.rating === 0) {
      error(t('pleaseSelectRating'));
      return;
    }

    if (!reviewForm.comment.trim()) {
      error(t('pleaseWriteReview'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', reviewForm.rating);
      formData.append('comment', reviewForm.comment);

      reviewForm.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        success(t('reviewSubmitted'));
        setShowReviewForm(false);
        setReviewForm({ rating: 0, comment: '', images: [] });
        loadReviews();
      } else {
        const data = await response.json();
        error(data.message || t('submitReviewFailed'));
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      error(t('networkError'));
    }
  };

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });

      if (response.ok) {
        loadReviews();
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (reviewForm.images.length + files.length > maxFiles) {
      error(t('maxImagesExceeded', { max: maxFiles }));
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        error(t('imageTooLarge', { maxSize: '5MB' }));
        return false;
      }
      if (!file.type.startsWith('image/')) {
        error(t('invalidImageType'));
        return false;
      }
      return true;
    });

    setReviewForm(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
  };

  const removeImage = (index) => {
    setReviewForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="stats" />
        {[...Array(3)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('customerReviews')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reviewsCount', { count: stats.total })}
          </p>
        </div>

        {showWriteReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('writeReview')}
          </button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 rtl:space-x-reverse">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating))}
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('basedOnReviews', { count: stats.total })}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 max-w-md">
            <div className="space-y-2">
              {stats.ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse min-w-[40px]">
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

                  <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[30px]">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                id="verifiedOnly"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="verifiedOnly" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                {t('verifiedPurchasesOnly')}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4 rtl:space-x-reverse">
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
                  {review.verified && (
                    <span className="flex items-center space-x-1 rtl:space-x-reverse text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{t('verifiedPurchase')}</span>
                    </span>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                  {review.comment}
                </p>

                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 rtl:space-x-reverse mb-3 overflow-x-auto">
                    {review.images.map((image, index) => (
                      <LazyImage
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                        fallbackSrc="/placeholder-image.png"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                    <DateDisplay date={review.createdAt} />
                    <button
                      onClick={() => handleHelpfulVote(review.id)}
                      className="flex items-center space-x-1 rtl:space-x-reverse hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{t('helpful')} ({review.helpfulCount || 0})</span>
                    </button>
                  </div>

                  {review.response && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {t('sellerResponse')}
                        </span>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        {review.response}
                      </p>
                    </div>
                  )}
                </div>
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
              {t('noReviewsYet')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('beFirstToReview')}
            </p>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <Modal
        isOpen={showReviewForm}
        onClose={() => {
          setShowReviewForm(false);
          setReviewForm({ rating: 0, comment: '', images: [] });
        }}
        title={t('writeReview')}
      >
        <form onSubmit={handleSubmitReview} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('yourRating')}
            </label>
            {renderStars(reviewForm.rating, true, (rating) => setReviewForm(prev => ({ ...prev, rating })))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('yourReview')}
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              placeholder={t('shareYourThoughts')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('reviewGuidelines')}
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('addPhotos')} ({t('optional')})
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {reviewForm.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}

              {reviewForm.images.length < 5 && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </label>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('maxImages', { max: 5 })} • {t('maxSize', { size: '5MB' })}
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                setReviewForm({ rating: 0, comment: '', images: [] });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {t('submitReview')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerReviews;