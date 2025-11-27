import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '../../../lib/framerLazy';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useDebounce } from '../../../hooks/usePerformanceOptimization';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Package,
  ChevronRight,
  Loader2
} from 'lucide-react';

/**
 * SearchBarModern - شريط البحث الحديث
 * 
 * الميزات:
 * - بحث فوري مع اقتراحات
 * - سجل البحث
 * - البحث الشائع
 * - دعم كامل للـ RTL
 * - أداء محسّن
 */
const SearchBarModern = ({
  placeholder,
  onSearch,
  autoFocus = false,
  showSuggestions = true,
  showHistory = true,
  showTrending = true,
  maxSuggestions = 8,
  debounceDelay = 300,
  className = ''
}) => {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  const isRTL = locale === 'ar';
  
  // Debounced search
  const debouncedQuery = useDebounce(query, debounceDelay);
  
  // تحميل البيانات الأولية
  useEffect(() => {
    // تحميل سجل البحث
    const savedHistory = localStorage.getItem('search-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
    
    // تحميل البحث الشائع (يمكن جلبه من API)
    setTrending([
      { id: 1, query: 'عروض', category: 'offers' },
      { id: 2, query: 'جديد', category: 'new' },
      { id: 3, query: 'أجهزة', category: 'electronics' },
      { id: 4, query: 'ملابس', category: 'fashion' },
      { id: 5, query: 'خصومات', category: 'sale' }
    ]);
  }, []);
  
  // البحث عن اقتراحات
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      
      try {
        // محاكاة API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // اقتراحات وهمية
        const mockSuggestions = [
          {
            id: 1,
            title: `${debouncedQuery} - نتائج شائعة`,
            type: 'product',
            url: `/search?q=${encodeURIComponent(debouncedQuery)}`
          },
          {
            id: 2,
            title: `${debouncedQuery} - فئة`,
            type: 'category',
            url: `/category/${debouncedQuery.toLowerCase()}`
          },
          {
            id: 3,
            title: `${debouncedQuery} - عروض خاصة`,
            type: 'offer',
            url: `/offers?q=${encodeURIComponent(debouncedQuery)}`
          }
        ];
        
        setSuggestions(mockSuggestions.slice(0, maxSuggestions));
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery, maxSuggestions]);
  
  // معالجة التغيير في المدخل
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  }, []);
  
  // معالجة البحث
  const handleSearch = useCallback((searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    // إضافة للسجل
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
    
    // تنفيذ البحث
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
    
    setIsOpen(false);
    inputRef.current?.blur();
  }, [query, history, onSearch, navigate]);
  
  // معالجة النقر على اقتراح
  const handleSuggestionClick = useCallback((suggestion) => {
    if (suggestion.url) {
      navigate(suggestion.url);
    } else {
      handleSearch(suggestion.title);
    }
    setIsOpen(false);
  }, [handleSearch, navigate]);
  
  // معالجة اختيار من لوحة المفاتيح
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    const totalItems = suggestions.length + history.length + trending.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          // تحديد العنصر المحدد
          let item;
          if (selectedIndex < suggestions.length) {
            item = suggestions[selectedIndex];
          } else if (selectedIndex < suggestions.length + history.length) {
            item = history[selectedIndex - suggestions.length];
          } else {
            item = trending[selectedIndex - suggestions.length - history.length];
          }
          
          if (typeof item === 'string') {
            handleSearch(item);
          } else {
            handleSuggestionClick(item);
          }
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, history, trending, selectedIndex, handleSearch, handleSuggestionClick]);
  
  // إغلاق عند النقر بالخارج
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // مسح البحث
  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);
  
  // الحصول على العناصر المعروضة
  const displayItems = [];
  let currentIndex = 0;
  
  if (query.length >= 2) {
    suggestions.forEach(suggestion => {
      displayItems.push({
        ...suggestion,
        type: 'suggestion',
        index: currentIndex++
      });
    });
  }
  
  if (showHistory && history.length > 0 && query.length < 2) {
    history.forEach(item => {
      displayItems.push({
        title: item,
        type: 'history',
        index: currentIndex++
      });
    });
  }
  
  if (showTrending && trending.length > 0 && query.length < 2) {
    trending.forEach(item => {
      displayItems.push({
        ...item,
        type: 'trending',
        index: currentIndex++
      });
    });
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* شريط البحث */}
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || t('search_placeholder')}
          autoFocus={autoFocus}
          className={`w-full py-3 px-10 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        />
        
        {/* زر المسح */}
        {query && (
          <button
            onClick={handleClear}
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
          >
            <X size={18} />
          </button>
        )}
        
        {/* أيقونة التحميل */}
        {isLoading && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
            <Loader2 size={18} className="animate-spin text-blue-500" />
          </div>
        )}
      </div>
      
      {/* قائمة الاقتراحات */}
      <AnimatePresence>
        {isOpen && displayItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
          >
            {/* أقسام الاقتراحات */}
            {query.length >= 2 && suggestions.length > 0 && (
              <div className="p-2">
                <div className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('suggestions')}
                </div>
                {suggestions.map((suggestion, index) => {
                  const isSelected = selectedIndex === suggestion.index;
                  
                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <Search size={16} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {suggestion.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.type === 'product' && t('products')}
                          {suggestion.type === 'category' && t('category')}
                          {suggestion.type === 'offer' && t('offers')}
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* سجل البحث */}
            {showHistory && history.length > 0 && query.length < 2 && (
              <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                <div className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('recent_searches')}
                </div>
                {history.map((item, index) => {
                  const isSelected = selectedIndex === displayItems.findIndex(d => d.title === item && d.type === 'history');
                  
                  return (
                    <button
                      key={item}
                      onClick={() => handleSearch(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm">{item}</span>
                      <ChevronRight size={16} className={`ml-auto text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* البحث الشائع */}
            {showTrending && trending.length > 0 && query.length < 2 && (
              <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                <div className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('trending_searches')}
                </div>
                {trending.map((item, index) => {
                  const isSelected = selectedIndex === displayItems.findIndex(d => d.id === item.id && d.type === 'trending');
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSearch(item.query)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <TrendingUp size={16} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.query}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t(item.category)}
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBarModern;
