import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for virtual scrolling lists
 * 
 * @param {Array} items - List of items to render
 * @param {Object} options - Configuration options
 * @returns {Object} - Virtual list data and functions
 */
export const useVirtualList = (items = [], options = {}) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    getItemKey = (item, index) => index
  } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );
  
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);
  
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    key: getItemKey(item, startIndex + index)
  }));
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [itemHeight]);
  
  const scrollToItem = useCallback((item) => {
    const index = items.findIndex(i => getItemKey(i, items.indexOf(i)) === getItemKey(item, items.indexOf(item)));
    if (index !== -1) {
      scrollToIndex(index);
    }
  }, [items, getItemKey, scrollToIndex]);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    containerRef,
    handleScroll,
    scrollToIndex,
    scrollToItem,
    startIndex,
    endIndex
  };
};

export default useVirtualList;
