import { Pressable, Text as RNText, View, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../lib/theme';
import { ReactNode } from 'react';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ flex: 1, padding: 16, backgroundColor: t.bg }, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <RNText style={{ fontSize: 20, fontWeight: '700', color: t.fg }}>{children}</RNText>;
}

export function Text({ children, muted = false, size = 14, style }: { children: ReactNode; muted?: boolean; size?: number; style?: TextStyle }) {
  const t = useTheme();
  return <RNText style={[{ color: muted ? t.muted : t.fg, fontSize: size }, style]}>{children}</RNText>;
}

export function Button({ title, onPress, variant = 'primary' }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.primary : variant === 'secondary' ? t.secondary : 'transparent';
  const color = variant === 'ghost' ? t.primary : '#fff';
  const borderColor = variant === 'ghost' ? t.primary : 'transparent';
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 14, borderRadius: t.radius, borderWidth: 1, borderColor }}>
      <RNText style={{ color, fontWeight: '600', textAlign: 'center' }}>{title}</RNText>
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.bg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: t.radius, padding: 12 }}>
      {children}
    </View>
  );
}
