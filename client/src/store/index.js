import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { setCssVar, hexToRgb } from '../lib/colors';

// Root store starter: keep it small and practical. Use this as the canonical shape
// for cross-cutting UI state (theme, global counters, small feature flags).
// This is intentionally tiny; migrate specific logic from contexts into slices
// as needed (e.g., cart slice, auth slice). Zustand doesn't require Providers.

export const useRootStore = create(devtools((set, get) => ({
  // Theme: 'light' | 'dark' | 'system'
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'system',
  setTheme: (next) => {
    if (!['light','dark','system'].includes(next)) return;
    try { localStorage.setItem('theme', next); } catch {}
    set({ theme: next });
    // apply immediate DOM flags used by CSS variables
    try {
      const effective = next === 'system' ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next;
      document.documentElement.setAttribute('data-theme', effective);
      document.documentElement.classList.toggle('theme-dark', effective === 'dark');
    } catch {}
  },

  // Primary color, stored as hex (e.g. #69be3c)
  primaryColor: getCssDefault('--color-primary') || '#69be3c',
  setPrimaryColor: (hex) => {
    if (!hex) return;
    set({ primaryColor: hex });
    setCssVar('--color-primary', hex);
    const rgb = hexToRgb(hex);
    if (rgb) setCssVar('--color-primary-rgb', rgb);
  },

  // Small UI bits
  drawerOpen: false,
  setDrawerOpen: (v) => set({ drawerOpen: !!v }),

  // feature flags placeholder
  flags: {},
  setFlag: (k, v) => set(state => ({ flags: { ...state.flags, [k]: v } })),
})));

function getCssDefault(name) {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val ? val.trim() : null;
  } catch { return null; }
}
