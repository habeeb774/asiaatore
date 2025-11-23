import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';

// theme: 'light' | 'dark' | 'system'
const ThemeContext = createContext({ theme: 'system', setTheme: () => {} });

// Compute effective theme ('light' | 'dark') given current preference
const computeEffectiveTheme = (pref) => {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  // system
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const html = document.documentElement; // html element
  const effective = computeEffectiveTheme(theme);
  // Class API for Tailwind-like selectors
  html.classList.remove('theme-light', 'theme-dark');
  if (effective === 'light' && theme !== 'system') html.classList.add('theme-light');
  if (effective === 'dark' && theme !== 'system') html.classList.add('theme-dark');
  // Data attribute for SCSS selectors like [data-theme="dark"]
  try {
    html.setAttribute('data-theme', effective);
  } catch {}
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
  const mqlRef = useRef(null);

  // Apply and persist chosen theme
  useEffect(() => { applyThemeClass(theme); }, [theme]);
  useEffect(() => { try { localStorage.setItem('theme', theme); } catch {} }, [theme]);

  // Apply once on mount to avoid FOUC
  useEffect(() => { applyThemeClass(theme); }, []);

  // Keep in sync with OS when on 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    // Clean previous listener
    if (mqlRef.current && mqlRef.current.removeEventListener) {
      try { mqlRef.current.removeEventListener('change', applyOnChange); } catch {}
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mqlRef.current = mql;
    function applyOnChange() { if (theme === 'system') applyThemeClass('system'); }
    try { mql.addEventListener('change', applyOnChange); } catch {}
    return () => { try { mql.removeEventListener('change', applyOnChange); } catch {} };
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!['light','dark','system'].includes(next)) return;
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

