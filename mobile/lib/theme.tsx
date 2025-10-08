import { createContext, useContext, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';

// Mirror web tokens from src/index.css (:root --color-*)
export type ThemeTokens = {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  bg: string;
  fg: string;
  success: string;
  warning: string;
  danger: string;
  ring: string;
  radius: number;
  spacing: (n: number) => number; // 4px scale
  shadowCard: string;
};

const lightTokens: ThemeTokens = {
  primary: '#69be3c',
  secondary: '#2eafff',
  accent: '#2eafff',
  muted: '#6b7280',
  bg: '#ffffff',
  fg: '#213547',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  ring: 'rgba(99,102,241,0.4)',
  radius: 12,
  spacing: (n) => n * 4,
  shadowCard: Platform.select({
    ios: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
    android: 'elevation:2',
    default: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)'
  }) as string,
};

const darkTokens: ThemeTokens = {
  ...lightTokens,
  bg: '#0b0f19',
  fg: 'rgba(255,255,255,0.90)',
  muted: '#94a3b8',
};

const ThemeContext = createContext<ThemeTokens>(lightTokens);

export function ThemeProvider({ children, overrides }: { children: React.ReactNode; overrides?: Partial<ThemeTokens> }) {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? darkTokens : lightTokens;
  const tokens = useMemo(() => ({ ...base, ...(overrides || {}) }), [base, overrides]);
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
