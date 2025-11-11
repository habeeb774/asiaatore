import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLanguage, LocalizedText } from '../../contexts/LanguageContext';
import { useNotifications } from '../../components/Notification/Notification';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import { Modal } from '../Modal';

const AdvancedSearch = ({
  className = '',
  placeholder = 'searchProducts',
  showFilters = true,
  showSuggestions = true,
  maxResults = 50,
  onResultSelect = null
}) => {
  const { t, language } = useLanguage();
  const { error } = useNotifications();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [rating, setRating] = useState('all');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Categories
  const categories = [
    { id: 'all', name: t('allCategories') },
    { id: 'electronics', name: t('electronics') },
    { id: 'clothing', name: t('clothing') },
    { id: 'books', name: t('books') },
    { id: 'home', name: t('home') },
    { id: 'sports', name: t('sports') },
    { id: 'beauty', name: t('beauty') }
  ];

  // Load search history
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save search history
  const saveToHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;

    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
        if (showSuggestions) {
          loadSuggestions();
        }
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedCategory, priceRange, rating, inStock, sortBy, performSearch, loadSuggestions, showSuggestions]);

  // Perform search
  const performSearch = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        q: query,
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        rating: rating,
        inStock: inStock.toString(),
        sortBy: sortBy,
        page: currentPage.toString(),
        limit: maxResults.toString()
      });

      const response = await fetch(`/api/search/advanced?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      } else {
        error(t('searchFailed'));
      }
    } catch (err) {
      console.error('Search failed:', err);
      error(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, priceRange, rating, inStock, sortBy, currentPage, maxResults, t, error]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  }, [query]);

  // Handle search submission
  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      saveToHistory(searchQuery);
      performSearch();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  // Handle result selection
  const handleResultSelect = (result) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setShowResults(false);
    setQuery('');
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
    setCurrentPage(1);
    searchInputRef.current?.focus();
  };

  // Clear history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setSuggestions([]);
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown' && (suggestions.length > 0 || results.length > 0)) {
      e.preventDefault();
      // Focus first result or suggestion
      const firstItem = resultsRef.current?.querySelector('[data-search-item]');
      firstItem?.focus();
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`${language.direction === 'rtl' ? 'rtl' : 'ltr'} relative ${className}`} dir={language.direction}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.length >= 2 && showSuggestions) {
                  loadSuggestions();
                }
              }}
              placeholder={t(placeholder)}
              className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Search Icon */}
            <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-3 rtl:pr-0 rtl:pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Clear Button */}
            {query && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${
                showFiltersPanel ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFiltersPanel && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('category')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('priceRange')}
                </label>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    type="number"
                    placeholder={t('min')}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder={t('max')}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('minimumRating')}
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">{t('allRatings')}</option>
                  <option value="4">4+ ⭐</option>
                  <option value="3">3+ ⭐</option>
                  <option value="2">2+ ⭐</option>
                  <option value="1">1+ ⭐</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('sortBy')}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="relevance">{t('relevance')}</option>
                  <option value="price_low">{t('priceLowToHigh')}</option>
                  <option value="price_high">{t('priceHighToLow')}</option>
                  <option value="rating">{t('highestRated')}</option>
                  <option value="newest">{t('newest')}</option>
                  <option value="popular">{t('mostPopular')}</option>
                </select>
              </div>
            </div>

            {/* In Stock Filter */}
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                {t('inStockOnly')}
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Search Results & Suggestions */}
      {(showResults || suggestions.length > 0) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-40"
        >
          {/* Suggestions */}
          {suggestions.length > 0 && !showResults && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                {t('suggestions')}
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  data-search-item
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {query === '' && searchHistory.length > 0 && !showResults && (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('recentSearches')}
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {t('clear')}
                </button>
              </div>
              {searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(historyItem)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  data-search-item
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">{historyItem}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="p-2">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonLoader key={i} type="search-result" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                    {t('results')} ({results.length})
                  </div>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      data-search-item
                    >
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <LazyImage
                          src={result.image}
                          alt={result.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                          fallbackSrc="/placeholder-product.png"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.name}
                          </div>

                          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                            {renderStars(result.rating)}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({result.reviewCount})
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              ${result.price}
                            </div>

                            {result.inStock ? (
                              <span className="text-sm text-green-600 dark:text-green-400">
                                {t('inStock')}
                              </span>
                            ) : (
                              <span className="text-sm text-red-600 dark:text-red-400">
                                {t('outOfStock')}
                              </span>
                            )}
                          </div>

                          {result.category && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('in')} {result.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('noResultsFound')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('tryDifferentSearch')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;