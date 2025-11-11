import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const SocialCommerceContext = createContext();

export const useSocialCommerce = () => {
  const context = useContext(SocialCommerceContext);
  if (!context) {
    throw new Error('useSocialCommerce must be used within a SocialCommerceProvider');
  }
  return context;
};

export const SocialCommerceProvider = ({ children }) => {
  const [socialPosts, setSocialPosts] = useState([]);
  const [userInteractions, setUserInteractions] = useState({});
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [userGeneratedContent, setUserGeneratedContent] = useState([]);

  // Initialize with sample data
  useEffect(() => {
    const samplePosts = [
      {
        id: 1,
        user: { name: 'Sarah Ahmed', avatar: '👩‍💼', verified: true },
        type: 'review',
        product: { id: 101, name: 'Wireless Headphones', image: '/api/placeholder/100/100' },
        content: 'These headphones are amazing! Perfect sound quality and battery life. Highly recommend! 🎧✨',
        images: ['/api/placeholder/300/300'],
        likes: 24,
        comments: 5,
        shares: 3,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        rating: 5
      },
      {
        id: 2,
        user: { name: 'Mohammed Ali', avatar: '👨‍💻', verified: false },
        type: 'unboxing',
        product: { id: 102, name: 'Smart Watch', image: '/api/placeholder/100/100' },
        content: 'Just unboxed my new smart watch! The design is sleek and the features are impressive. #TechLife',
        images: ['/api/placeholder/300/300', '/api/placeholder/300/300'],
        likes: 18,
        comments: 8,
        shares: 2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        rating: 4
      },
      {
        id: 3,
        user: { name: 'Fatima Hassan', avatar: '👩‍🎨', verified: true },
        type: 'styling',
        product: { id: 103, name: 'Designer Dress', image: '/api/placeholder/100/100' },
        content: 'Styled this beautiful dress for a night out! The fit is perfect and the color is stunning. 💃',
        images: ['/api/placeholder/300/300'],
        likes: 67,
        comments: 12,
        shares: 15,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        rating: 5
      }
    ];

    const sampleTrending = [
      { id: 101, name: 'Wireless Headphones', trend: '🔥 Hot', mentions: 45 },
      { id: 102, name: 'Smart Watch', trend: '📈 Rising', mentions: 32 },
      { id: 103, name: 'Designer Dress', trend: '⭐ Popular', mentions: 28 }
    ];

    setSocialPosts(samplePosts);
    setTrendingProducts(sampleTrending);
  }, []);

  // Like/unlike post
  const toggleLike = (postId) => {
    setSocialPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = userInteractions[postId]?.liked;
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    setUserInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        liked: !prev[postId]?.liked
      }
    }));
  };

  // Add comment
  const addComment = (postId, comment) => {
    setSocialPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1
        };
      }
      return post;
    }));

    // In a real app, you'd save the comment to a database
    console.log('Comment added to post', postId, ':', comment);
  };

  // Share post
  const sharePost = (postId) => {
    setSocialPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1
        };
      }
      return post;
    }));

    setUserInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        shared: true
      }
    }));
  };

  // Create user post
  const createPost = (postData) => {
    const newPost = {
      id: Date.now(),
      user: { name: 'You', avatar: '😊', verified: false },
      ...postData,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date()
    };

    setSocialPosts(prev => [newPost, ...prev]);
    return newPost.id;
  };

  // Follow user
  const followUser = (userId) => {
    setUserInteractions(prev => ({
      ...prev,
      follows: {
        ...prev.follows,
        [userId]: !prev.follows?.[userId]
      }
    }));
  };

  // Report post
  const reportPost = (postId, reason) => {
    console.log('Post reported:', postId, 'Reason:', reason);
    // In a real app, this would send to moderation system
  };

  const value = {
    socialPosts,
    userInteractions,
    trendingProducts,
    userGeneratedContent,
    toggleLike,
    addComment,
    sharePost,
    createPost,
    followUser,
    reportPost
  };

  return (
    <SocialCommerceContext.Provider value={value}>
      {children}
    </SocialCommerceContext.Provider>
  );
};

const SocialFeed = ({ className = '' }) => {
  const { socialPosts, toggleLike, addComment, sharePost, userInteractions } = useSocialCommerce();
  const { language } = useLanguage();
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const loadMorePosts = () => {
    setVisiblePosts(prev => prev + 5);
  };

  const handleComment = (postId) => {
    if (newComment.trim()) {
      addComment(postId, newComment);
      setNewComment('');
      setActiveCommentPost(null);
    }
  };

  return (
    <div className={`social-feed ${className}`} dir={language.direction}>
      <div className="space-y-6">
        {socialPosts.slice(0, visiblePosts).map((post) => (
          <SocialPost
            key={post.id}
            post={post}
            isLiked={userInteractions[post.id]?.liked}
            onLike={() => toggleLike(post.id)}
            onComment={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
            onShare={() => sharePost(post.id)}
            showCommentInput={activeCommentPost === post.id}
            commentValue={newComment}
            onCommentChange={setNewComment}
            onCommentSubmit={() => handleComment(post.id)}
          />
        ))}

        {visiblePosts < socialPosts.length && (
          <div className="text-center">
            <button
              onClick={loadMorePosts}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {language.code === 'ar' ? 'تحميل المزيد' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SocialPost = ({
  post,
  isLiked,
  onLike,
  onComment,
  onShare,
  showCommentInput,
  commentValue,
  onCommentChange,
  onCommentSubmit
}) => {
  const { language } = useLanguage();
  const [showShareOptions, setShowShareOptions] = useState(false);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return language.code === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    } else if (hours < 24) {
      return language.code === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    } else {
      return language.code === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
    }
  };

  const shareOptions = [
    { label: 'Facebook', icon: '📘', action: () => console.log('Share to Facebook') },
    { label: 'Twitter', icon: '🐦', action: () => console.log('Share to Twitter') },
    { label: 'Instagram', icon: '📷', action: () => console.log('Share to Instagram') },
    { label: 'WhatsApp', icon: '💬', action: () => console.log('Share to WhatsApp') },
    { label: 'Copy Link', icon: '🔗', action: () => navigator.clipboard.writeText(window.location.href) }
  ];

  return (
    <div className="social-post bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg">
            {post.user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {post.user.name}
              </span>
              {post.user.verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatTimeAgo(post.timestamp)} • {post.type}
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-900 dark:text-white mb-3">{post.content}</p>

        {/* Product Info */}
        {post.product && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
            <LazyImage
              src={post.product.image}
              alt={post.product.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {post.product.name}
              </h4>
              {post.rating && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${i < post.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">
              {language.code === 'ar' ? 'عرض المنتج' : 'View Product'}
            </button>
          </div>
        )}

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} mb-3`}>
            {post.images.map((image, index) => (
              <LazyImage
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-4">
          <span>{post.likes} {language.code === 'ar' ? 'إعجاب' : 'likes'}</span>
          <span>{post.comments} {language.code === 'ar' ? 'تعليق' : 'comments'}</span>
          <span>{post.shares} {language.code === 'ar' ? 'مشاركة' : 'shares'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={onLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {language.code === 'ar' ? 'إعجاب' : 'Like'}
        </button>

        <button
          onClick={onComment}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {language.code === 'ar' ? 'تعليق' : 'Comment'}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            {language.code === 'ar' ? 'مشاركة' : 'Share'}
          </button>

          {showShareOptions && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
              {shareOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action();
                    setShowShareOptions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      {showCommentInput && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentValue}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={language.code === 'ar' ? 'اكتب تعليق...' : 'Write a comment...'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && onCommentSubmit()}
            />
            <button
              onClick={onCommentSubmit}
              disabled={!commentValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {language.code === 'ar' ? 'إرسال' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TrendingProducts = ({ className = '' }) => {
  const { trendingProducts } = useSocialCommerce();
  const { language } = useLanguage();

  return (
    <div className={`trending-products ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {language.code === 'ar' ? 'المنتجات الرائجة' : 'Trending Products'}
      </h3>

      <div className="space-y-3">
        {trendingProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              📦
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{product.trend}</span>
                <span>•</span>
                <span>{product.mentions} {language.code === 'ar' ? 'ذكر' : 'mentions'}</span>
              </div>
            </div>
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">
              {language.code === 'ar' ? 'عرض' : 'View'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreatePostModal = ({ isOpen, onClose }) => {
  const { createPost } = useSocialCommerce();
  const { language } = useLanguage();
  const [postData, setPostData] = useState({
    type: 'review',
    content: '',
    product: null,
    images: [],
    rating: 5
  });

  const postTypes = [
    { value: 'review', label: language.code === 'ar' ? 'مراجعة' : 'Review', icon: '⭐' },
    { value: 'unboxing', label: language.code === 'ar' ? 'فك التغليف' : 'Unboxing', icon: '📦' },
    { value: 'styling', label: language.code === 'ar' ? 'تنسيق' : 'Styling', icon: '👗' },
    { value: 'tip', label: language.code === 'ar' ? 'نصيحة' : 'Tip', icon: '💡' }
  ];

  const handleSubmit = () => {
    if (postData.content.trim()) {
      createPost(postData);
      setPostData({
        type: 'review',
        content: '',
        product: null,
        images: [],
        rating: 5
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="create-post-modal" dir={language.direction}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {language.code === 'ar' ? 'إنشاء منشور' : 'Create Post'}
          </h2>

          {/* Post Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language.code === 'ar' ? 'نوع المنشور' : 'Post Type'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {postTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPostData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    postData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language.code === 'ar' ? 'المحتوى' : 'Content'}
            </label>
            <textarea
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={language.code === 'ar' ? 'ماذا تريد مشاركته؟' : 'What would you like to share?'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Rating (for reviews) */}
          {postData.type === 'review' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language.code === 'ar' ? 'التقييم' : 'Rating'}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPostData(prev => ({ ...prev, rating: star }))}
                    className={`text-2xl ${star <= postData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {language.code === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!postData.content.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {language.code === 'ar' ? 'نشر' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export { SocialFeed, TrendingProducts, CreatePostModal };