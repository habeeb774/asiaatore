import React, { useState } from 'react';
import SafeImage from '../../common/SafeImage';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveLocalized } from '../../../utils/locale';
import { Heart, ShoppingCart, BarChart3, Eye } from 'lucide-react';

const ProductCard = ({
  product,
  variant = 'default',
  onAddToCart,
  onViewDetails,
  onAddToWishlist,
  onCompare,
  showRating = true,
  showBadges = true,
  showActions = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { locale } = useLanguage();

  const getVariantStyles = () => {
    const variants = {
      default: 'bg-white shadow-sm hover:shadow-md',
      compact: 'bg-gray-50 border border-gray-200',
      featured: 'bg-gradient-to-br from-white to-blue-50 shadow-lg',
      simple: 'bg-transparent border-none shadow-none'
    };
    return variants[variant] || variants.default;
  };

  const calculatePrice = () => {
    if (!product) return 0;
    if (product.discount) {
      const discountAmount = (product.price * product.discount) / 100;
      return product.price - discountAmount;
    }
    return product.price;
  };

  const renderBadges = () => {
    if (!showBadges || !product) return null;

    const badges = [];
    if (product.isNew) {
      badges.push({ label: 'جديد', color: 'bg-green-500' });
    }
    if (product.discount) {
      badges.push({ label: `%${product.discount}`, color: 'bg-red-500' });
    }
    if (product.isBestSeller) {
      badges.push({ label: 'الأكثر مبيعاً', color: 'bg-purple-500' });
    }

    return (
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {badges.map((badge, index) => (
          <span
            key={index}
            className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    );
  };

  const renderRating = () => {
    if (!showRating || !product?.rating) return null;

    return (
      <div className="flex items-center gap-1 mb-2">
        <div className="flex text-yellow-400">
          {'★'.repeat(Math.floor(product.rating))}
          {'☆'.repeat(5 - Math.floor(product.rating))}
        </div>
        <span className="text-sm text-gray-600">({product.reviewCount})</span>
      </div>
    );
  };

  const renderActions = () => {
    if (!showActions || !product) return null;

    return (
      <div className={`flex gap-2 transition-all duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={() => onAddToCart?.(product, quantity)}
          className="flex-1 bg-primary text-white py-2 px-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          أضف للسلة
        </button>

        <div className="flex gap-1">
          <button
            onClick={() => onAddToWishlist?.(product)}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="أضف للمفضلة"
          >
            <Heart size={16} />
          </button>
          <button
            onClick={() => onCompare?.(product)}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="قارن المنتج"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ${getVariantStyles()} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image area: circular for 'featured' variant, square otherwise */}
      <div className={variant === 'featured' ? 'flex items-center justify-center p-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : 'relative aspect-square overflow-hidden'}>
        {variant === 'featured' ? (
          <div className="w-36 h-36 rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
            {product?.image ? (
              <SafeImage
                src={product.image}
                alt={resolveLocalized(product?.name, locale) || ''}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
              </div>
            )}
          </div>
        ) : (
          <>
            {product?.image ? (
              <SafeImage
                src={product.image}
                alt={resolveLocalized(product?.name, locale) || ''}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
              </div>
            )}
            {renderBadges()}

            <button
              onClick={() => onViewDetails?.(product)}
              className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg transition-all duration-300 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              title="عرض سريع"
            >
              <Eye size={16} />
            </button>
          </>
        )}
      </div>

      <div className="p-4">
        {product?.category && (
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category}
          </span>
        )}

        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
          {resolveLocalized(product?.name, locale)}
        </h3>

        {renderRating()}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {Number(calculatePrice()).toFixed(2)} ر.س
          </span>
          {product?.discount && (
            <span className="text-sm text-gray-500 line-through">
              {Number(product.price).toFixed(2)} ر.س
            </span>
          )}
        </div>

        {product?.stock && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>المخزون:</span>
              <span>{product.stock} متبقي</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((product.stock / 100) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {renderActions()}
      </div>
    </div>
  );
};

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-300" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-6 bg-gray-300 rounded w-full" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-10 bg-gray-300 rounded" />
    </div>
  </div>
);

export const ProductCardGrid = ({ children, columns = 4 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
    {children}
  </div>
);

export default ProductCard;
