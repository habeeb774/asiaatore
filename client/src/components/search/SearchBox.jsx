import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../stores/LanguageContext';

export default function SearchBox({ onSearch, placeholder, className = '' }) {
  const { locale } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const isRTL = locale === 'ar';

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || (isRTL ? 'البحث عن المنتجات...' : 'Search products...')}
          className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isRTL ? 'text-right' : 'text-left'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            className="p-1 text-gray-400 hover:text-gray-600 ml-1"
            disabled={!query.trim()}
          >
            <Search size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}