import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing dark mode state and persistence
 * Handles localStorage synchronization and body class updates
 *
 * @returns {Object} Dark mode state and controls
 * @property {boolean} darkMode - Current dark mode state
 * @property {Function} toggleDarkMode - Function to toggle dark mode
 * @property {boolean} isInitialized - Whether the hook has finished initializing
 */
export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dark-mode') === 'true';
      setDarkMode(saved);
      updateBodyClasses(saved);
      setIsInitialized(true);
    } catch (error) {
      console.warn('Failed to load dark mode preference:', error);
      setIsInitialized(true);
    }
  }, []);

  // Update body classes when dark mode changes
  useEffect(() => {
    if (isInitialized) {
      updateBodyClasses(darkMode);
      try {
        localStorage.setItem('dark-mode', darkMode);
      } catch (error) {
        console.warn('Failed to save dark mode preference:', error);
      }
    }
  }, [darkMode, isInitialized]);

  const updateBodyClasses = useCallback((isDark) => {
    const body = document.body;
    if (body) {
      body.classList.toggle('dark-mode', isDark);
      body.classList.toggle('light-mode', !isDark);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  return {
    darkMode,
    toggleDarkMode,
    isInitialized
  };
};