import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Camera, X, Upload, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../stores/ToastContext';
import api from '../services/api/client';

const ReviewForm = ({ productId, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const response = await api.post('/reviews/enhanced', reviewData);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('review.submitSuccess'));
      // Reset form
      setRating(0);
      setTitle('');
      setBody('');
      setImages([]);
      // Invalidate queries
      queryClient.invalidateQueries(['reviews', productId]);
      queryClient.invalidateQueries(['product', productId]);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('review.submitError'));
    }
  });

  const handleImageUpload = async (files) => {
    setUploading(true);
    try {
      const uploadedImages = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(t('review.imageTooLarge'));
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/upload/review-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploadedImages.push({
          url: response.data.url,
          alt: file.name
        });
      }

      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      toast.error(t('review.imageUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error(t('review.ratingRequired'));
      return;
    }

    if (!body.trim()) {
      toast.error(t('review.bodyRequired'));
      return;
    }

    submitReviewMutation.mutate({
      productId,
      rating,
      title: title.trim() || null,
      body: body.trim(),
      images
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        {t('review.writeReview')}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('review.rating')} *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && t(`review.rating${rating}`)}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('review.title')} ({t('common.optional')})
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('review.titlePlaceholder')}
          />
          <div className="text-xs text-gray-500 mt-1">
            {title.length}/100
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('review.body')} *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={t('review.bodyPlaceholder')}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {body.length}/1000
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('review.images')} ({t('common.optional')})
          </label>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(Array.from(e.target.files))}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span>{t('review.addImages')}</span>
            </button>
            <span className="text-sm text-gray-500">
              {images.length}/5 {t('review.imagesMax')}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitReviewMutation.isLoading || rating === 0 || !body.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitReviewMutation.isLoading && (
              <Loader className="w-4 h-4 animate-spin" />
            )}
            <span>{t('review.submit')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;