import React, { createContext, useContext, useEffect, useState } from 'react';

const ReviewsContext = createContext(null);

export const ReviewsProvider = ({ children }) => {
  const [reviewsMap, setReviewsMap] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_reviews');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('my_store_reviews', JSON.stringify(reviewsMap));
    } catch {}
  }, [reviewsMap]);

  const addReview = (productId, review) => {
    setReviewsMap(prev => {
      const existing = prev[productId] || [];
      return { ...prev, [productId]: [{ id: `r_${Date.now()}`, ...review, createdAt: new Date().toISOString() }, ...existing] };
    });
  };

  const getReviewsForProduct = (productId) => reviewsMap[productId] || [];

  return (
    <ReviewsContext.Provider value={{ reviewsMap, addReview, getReviewsForProduct }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => useContext(ReviewsContext);
export default ReviewsContext;
