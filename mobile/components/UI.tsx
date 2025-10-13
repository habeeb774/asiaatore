import { Pressable, Text as RNText, View, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../lib/theme';
import React, { ReactNode, forwardRef } from 'react';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ flex: 1, padding: 16, backgroundColor: t.bg }, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <RNText style={{ fontSize: 20, fontWeight: '700', color: t.fg }}>{children}</RNText>;
}

export function Text({ children, muted = false, size = 14, style, numberOfLines }: { children: ReactNode; muted?: boolean; size?: number; style?: TextStyle; numberOfLines?: number }) {
  const t = useTheme();
  return <RNText numberOfLines={numberOfLines} style={[{ color: muted ? t.muted : t.fg, fontSize: size }, style]}>{children}</RNText>;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean }>(
  ({ title, onPress, variant = 'primary', disabled = false }, ref) => {
    const t = useTheme();
    const bg = variant === 'primary' ? t.primary : variant === 'secondary' ? t.secondary : 'transparent';
    const color = variant === 'ghost' ? t.primary : '#fff';
    const borderColor = variant === 'ghost' ? t.primary : 'transparent';
    return (
      <Pressable ref={ref} onPress={onPress} disabled={disabled} style={{ backgroundColor: disabled ? '#cbd5e1' : bg, paddingVertical: 10, paddingHorizontal: 14, borderRadius: t.radius, borderWidth: 1, borderColor, opacity: disabled ? 0.7 : 1 }}>
        <RNText style={{ color: disabled ? '#475569' : color, fontWeight: '600', textAlign: 'center' }}>{title}</RNText>
      </Pressable>
    );
  }
);

export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.bg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: t.radius, padding: 12 }}>
      {children}
    </View>
  );
}
