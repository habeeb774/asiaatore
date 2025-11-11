import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Camera, X, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../stores/ToastContext';
import api from '../services/api/client';

const ReviewCard = ({ review, onVote, onRespond, isAdmin }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleVote = async (helpful) => {
    try {
      await api.post(`/reviews/${review.id}/helpful`, { helpful });
      onVote(review.id, helpful);
      toast.success(t('review.voteRecorded'));
    } catch (error) {
      toast.error(t('review.voteError'));
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) return;

    try {
      await api.post(`/reviews/${review.id}/response`, { response: responseText });
      setShowResponse(false);
      setResponseText('');
      onRespond(review.id);
      toast.success(t('review.responseAdded'));
    } catch (error) {
      toast.error(t('review.responseError'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {review.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{review.user.name}</span>
              {review.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('review.verifiedPurchase')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {t('review.helpful')}: {review.helpful}
        </div>
      </div>

      {/* Review Content */}
      {review.title && (
        <h4 className="font-medium text-gray-900">{review.title}</h4>
      )}
      {review.body && (
        <p className="text-gray-700 leading-relaxed">{review.body}</p>
      )}

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto">
          {review.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={image.alt || t('review.image')}
              className="w-20 h-20 object-cover rounded-lg border"
            />
          ))}
        </div>
      )}

      {/* Review Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          {!review.userVoted && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote(true)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{t('review.helpful')}</span>
              </button>
              <button
                onClick={() => handleVote(false)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{t('review.notHelpful')}</span>
              </button>
            </div>
          )}
          {review.userVoted && (
            <span className="text-sm text-gray-500">
              {review.userVote ? t('review.votedHelpful') : t('review.votedNotHelpful')}
            </span>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('review.respond')}</span>
          </button>
        )}
      </div>

      {/* Response Form */}
      {showResponse && (
        <div className="pt-4 border-t space-y-3">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={t('review.responsePlaceholder')}
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowResponse(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleResponse}
              disabled={!responseText.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t('review.addResponse')}
            </button>
          </div>
        </div>
      )}

      {/* Responses */}
      {review.responses && review.responses.length > 0 && (
        <div className="pt-4 border-t space-y-3">
          {review.responses.map((response) => (
            <div key={response.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">
                  {response.user.name}
                </span>
                <span className="text-sm text-gray-500">
                  ({t(`roles.${response.user.role}`)})
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(response.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{response.response}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;