import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing sidebar state and interactions
 * Handles sidebar open/close state and event-based communication
 *
 * @param {Object} sidebarContext - Sidebar context from provider
 * @returns {Object} Sidebar state and controls
 */
export const useSidebarState = (sidebarContext) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Memoize the context open value to prevent unnecessary re-renders
  const contextOpen = useMemo(() => {
    return sidebarContext && typeof sidebarContext.open === 'boolean' ? sidebarContext.open : null;
  }, [sidebarContext?.open]);

  // Sync with context if available
  useEffect(() => {
    if (contextOpen !== null) {
      setIsMenuOpen(contextOpen);
      return;
    }

    // Fallback to event-based communication
    const onState = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean') {
        setIsMenuOpen(e.detail.open);
      }
    };

    window.addEventListener('sidebar:state', onState);
    return () => window.removeEventListener('sidebar:state', onState);
  }, [contextOpen]);

  const toggleSidebar = useCallback(() => {
    if (sidebarContext && typeof sidebarContext.toggle === 'function') {
      sidebarContext.toggle();
    } else {
      // Fallback to event-based toggle
      try {
        window.dispatchEvent(new CustomEvent('sidebar:toggle', {
          detail: { cmd: 'toggle' }
        }));
      } catch (error) {
        console.warn('Failed to dispatch sidebar toggle event:', error);
      }
    }
  }, [sidebarContext?.toggle]);

  return {
    isMenuOpen,
    toggleSidebar
  };
};
