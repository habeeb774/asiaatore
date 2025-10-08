import { View } from 'react-native';
import { Text } from './UI';
import { useTheme } from '../lib/theme';

export function ListItem({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
      <Text style={{ fontWeight: '700', color: t.fg }}>{title}</Text>
      {subtitle ? <Text muted>{subtitle}</Text> : null}
    </View>
  );
}
