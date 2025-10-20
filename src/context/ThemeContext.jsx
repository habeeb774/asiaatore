import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// theme: 'light' | 'dark' | 'system'
const ThemeContext = createContext({ theme: 'system', setTheme: () => {} });

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const html = document.documentElement; // html element
  html.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') html.classList.add('theme-light');
  if (theme === 'dark') html.classList.add('theme-dark');
  // system => no explicit class; media query styles apply
};

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved && ['light','dark','system'].includes(saved)) return saved;
  } catch {}
  return 'system';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => { applyThemeClass(theme); }, [theme]);
  useEffect(() => { try { localStorage.setItem('theme', theme); } catch {} }, [theme]);

  // Apply once on mount to avoid FOUC
  useEffect(() => { applyThemeClass(theme); }, []);

  const setTheme = useCallback((next) => {
    if (!['light','dark','system'].includes(next)) return;
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

