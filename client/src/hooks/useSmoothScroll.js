import { useCallback, useRef } from 'react';

/**
 * Custom hook for smooth scrolling functionality
 * 
 * @returns {Object} - Smooth scroll functions
 */
export const useSmoothScroll = () => {
  const scrollContainerRef = useRef(null);
  
  const scrollToElement = useCallback((elementId, options = {}) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const {
      behavior = 'smooth',
      block = 'start',
      inline = 'nearest',
      offset = 0
    } = options;
    
    const top = element.offsetTop - offset;
    
    window.scrollTo({
      top,
      behavior
    });
  }, []);
  
  const scrollToTop = useCallback((options = {}) => {
    window.scrollTo({
      top: 0,
      behavior: options.behavior || 'smooth'
    });
  }, []);
  
  const scrollToBottom = useCallback((options = {}) => {
    const {
      behavior = 'smooth',
      offset = 0
    } = options;
    
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    window.scrollTo({
      top: documentHeight - windowHeight + offset,
      behavior
    });
  }, []);
  
  const scrollIntoView = useCallback((element, options = {}) => {
    if (!element) return;
    
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }, []);
  
  const scrollToPosition = useCallback((top, options = {}) => {
    window.scrollTo({
      top,
      behavior: options.behavior || 'smooth'
    });
  }, []);
  
  const scrollContainerTo = useCallback((top, options = {}) => {
    if (!scrollContainerRef.current) return;
    
    scrollContainerRef.current.scrollTo({
      top,
      behavior: options.behavior || 'smooth'
    });
  }, []);
  
  const scrollContainerIntoView = useCallback((element, options = {}) => {
    if (!scrollContainerRef.current || !element) return;
    
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }, []);
  
  return {
    scrollContainerRef,
    scrollToElement,
    scrollToTop,
    scrollToBottom,
    scrollIntoView,
    scrollToPosition,
    scrollContainerTo,
    scrollContainerIntoView
  };
};

export default useSmoothScroll;
