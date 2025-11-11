import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, LocalizedText, CurrencyDisplay } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';

const ProductCard = ({
  product,
  variant = 'default', // default, compact, featured
  showQuickView = true,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { addToCart, isInCart, updateQuantity } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);

  const images = product.images || [product.image];
  const hasMultipleImages = images.length > 1;
  const inCart = isInCart(product.id);
  const cartItem = inCart ? inCart : null;

  // Auto-rotate images on hover for featured variant
  useEffect(() => {
    if (!isHovered || !hasMultipleImages || variant !== 'featured') return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, hasMultipleImages, images.length, variant]);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = async (newQuantity) => {
    if (cartItem) {
      await updateQuantity(product.id, newQuantity);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const cardClasses = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden',
    compact: 'bg-white dark:bg-gray-800 rounded-md shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden',
    featured: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden'
  };

  const imageClasses = {
    default: 'w-full h-48',
    compact: 'w-full h-32',
    featured: 'w-full h-64'
  };

  return (
    <>
      <div
        className={`${cardClasses[variant]} ${className} ${language.direction === 'rtl' ? 'rtl' : 'ltr'}`}
        dir={language.direction}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="relative overflow-hidden group">
          <Link to={`/products/${product.id}`}>
            <LazyImage
              src={images[currentImageIndex]}
              alt={product.name}
              className={`${imageClasses[variant]} object-cover transition-transform duration-300 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              fallbackSrc="/placeholder-product.png"
            />
          </Link>

          {/* Image Navigation for multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  prevImage();
                }}
                className={`absolute top-1/2 ${language.direction === 'rtl' ? 'right-2' : 'left-2'} transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language.direction === 'rtl' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  nextImage();
                }}
                className={`absolute top-1/2 ${language.direction === 'rtl' ? 'left-2' : 'right-2'} transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language.direction === 'rtl' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                </svg>
              </button>
            </>
          )}

          {/* Image Indicators */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 rtl:space-x-reverse">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className={`absolute top-2 ${language.direction === 'rtl' ? 'left-2' : 'right-2'} flex flex-col space-y-1`}>
            {product.isNew && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                {t('new')}
              </span>
            )}
            {product.discount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                -{product.discount}%
              </span>
            )}
            {product.isOutOfStock && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                {t('outOfStock')}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`absolute top-2 ${language.direction === 'rtl' ? 'right-2' : 'left-2'} flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            {showQuickView && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowQuickViewModal(true);
                }}
                className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-colors"
                aria-label="Quick view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                // Add to wishlist functionality
              }}
              className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-colors"
              aria-label="Add to wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <Link
              to={`/categories/${product.category.id}`}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-1 block"
            >
              {product.category.name}
            </Link>
          )}

          {/* Product Name */}
          <Link to={`/products/${product.id}`}>
            <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 ${
              variant === 'compact' ? 'text-sm' : 'text-base'
            } hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}>
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1 rtl:space-x-reverse mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {product.rating} ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
            <CurrencyDisplay
              amount={product.price}
              className={`font-bold text-gray-900 dark:text-gray-100 ${
                variant === 'compact' ? 'text-sm' : 'text-lg'
              }`}
            />
            {product.originalPrice && product.originalPrice > product.price && (
              <CurrencyDisplay
                amount={product.originalPrice}
                className="text-sm text-gray-500 dark:text-gray-400 line-through"
              />
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-3">
            {product.isOutOfStock ? (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {t('outOfStock')}
              </span>
            ) : product.stock <= 5 ? (
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                {t('onlyXLeft', { count: product.stock })}
              </span>
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {t('inStock')}
              </span>
            )}
          </div>

          {/* Add to Cart / Quantity Controls */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {inCart ? (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => handleQuantityChange(cartItem.quantity - 1)}
                  className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                  disabled={cartItem.quantity <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(cartItem.quantity + 1)}
                  className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                  disabled={cartItem.quantity >= product.stock}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock || isAddingToCart}
                className={`flex-1 ${
                  variant === 'compact' ? 'px-3 py-1 text-sm' : 'px-4 py-2'
                } bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:cursor-not-allowed`}
              >
                {isAddingToCart ? (
                  <SkeletonLoader type="button" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
                    </svg>
                    <span>{t('addToCart')}</span>
                  </>
                )}
              </button>
            )}

            {variant !== 'compact' && (
              <Link
                to={`/products/${product.id}`}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="View product details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickViewModal && (
        <QuickViewModal
          product={product}
          onClose={() => setShowQuickViewModal(false)}
        />
      )}
    </>
  );
};

// Quick View Modal Component
const QuickViewModal = ({ product, onClose }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const images = product.images || [product.image];

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product, quantity);
      onClose();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${language.direction === 'rtl' ? 'rtl' : 'ltr'}`}
        dir={language.direction}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row">
          {/* Images */}
          <div className="md:w-1/2 p-4">
            <div className="relative">
              <LazyImage
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                fallbackSrc="/placeholder-product.png"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                    className={`absolute top-1/2 ${language.direction === 'rtl' ? 'right-2' : 'left-2'} transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language.direction === 'rtl' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                    className={`absolute top-1/2 ${language.direction === 'rtl' ? 'left-2' : 'right-2'} transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language.direction === 'rtl' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 rtl:space-x-reverse mt-4 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                      index === selectedImage
                        ? 'border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <LazyImage
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                      fallbackSrc="/placeholder-product.png"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {product.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <CurrencyDisplay
              amount={product.price}
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            />

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {product.description}
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quantity')}:
                </label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock || isAddingToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:cursor-not-allowed"
              >
                {isAddingToCart ? (
                  <SkeletonLoader type="button" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
                    </svg>
                    <span>{t('addToCart')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;