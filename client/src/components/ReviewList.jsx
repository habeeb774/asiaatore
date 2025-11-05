import React, { useState } from 'react';
import Button from './ui/Button';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';

const ReviewList = ({ productId }) => {
  const { getReviewsForProduct, addReview } = useReviews() || {};
  const { user } = useAuth() || {};
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

  const reviews = getReviewsForProduct ? getReviewsForProduct(productId) : [];

  const handleAdd = () => {
    if (!text.trim()) return;
    addReview(productId, { author: user?.id || 'guest', text, rating });
    setText('');
    setRating(5);
  };

  return (
    <div>
      <h4 className="font-semibold mb-2">المراجعات ({reviews.length})</h4>
      <div className="space-y-3 mb-4">
        {reviews.map(r => (
          <div key={r.id} className="p-3 border rounded">
            <div className="text-sm text-gray-600">{r.author} — {new Date(r.createdAt).toLocaleString()}</div>
            <div className="mt-1">{r.text}</div>
          </div>
        ))}
        {reviews.length === 0 && <div className="text-gray-600">لا توجد مراجعات حتى الآن</div>}
      </div>

      <div className="space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="اكتب مراجعتك..." rows={3} />
        <div className="flex items-center gap-2">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border px-2 py-1 rounded">
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} نجوم</option>)}
          </select>
          <Button variant="primary" className="px-4 py-2" onClick={handleAdd}>أضف مراجعة</Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewList;
