import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing search functionality with debouncing
 * Handles search query state, loading state, and debounced search execution
 *
 * @param {Object} options - Hook options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 600)
 * @param {Function} options.onSearch - Callback function called when search is executed
 * @returns {Object} Search state and controls
 */
export const useSearch = ({ debounceMs = 600, onSearch } = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const memoizedOnSearch = useCallback(onSearch, []);

  // Debounce search query
  useEffect(() => {
    if (!searchQuery) {
      setDebouncedQuery('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsLoading(false);

      // Execute search callback if provided
      if (memoizedOnSearch && typeof memoizedOnSearch === 'function') {
        try {
          memoizedOnSearch(searchQuery);
        } catch (error) {
          console.error('Search callback error:', error);
        }
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchQuery, debounceMs, memoizedOnSearch]);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const triggerSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setDebouncedQuery(searchQuery);
      if (memoizedOnSearch && typeof memoizedOnSearch === 'function') {
        memoizedOnSearch(searchQuery);
      }
    }
  }, [searchQuery, memoizedOnSearch]);

  return {
    searchQuery,
    debouncedQuery,
    isLoading,
    updateSearchQuery,
    clearSearch,
    triggerSearch
  };
};
