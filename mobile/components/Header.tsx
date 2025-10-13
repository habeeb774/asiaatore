import { Image, View } from 'react-native';
import { useStoreSettings } from '../lib/settings';
import { Title, Text } from './UI';
import { useTheme } from '../lib/theme';
import { API_BASE } from '../lib/config';

export function Header({ showTitle = true }: { showTitle?: boolean }) {
  const { data } = useStoreSettings();
  const t = useTheme();
  const name = data?.siteNameAr || data?.siteNameEn || 'شركة منفذ اسيا التجارية';
  const origin = API_BASE.replace(/\/?api\/?$/, '');
  const logo = data?.logo
    ? (data.logo.startsWith('http') ? data.logo : `${origin}${data.logo}`)
    : null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
      {logo ? (
        <Image source={{ uri: logo }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: t.bg }} />
      ) : null}
      {showTitle ? (
        <View>
          <Title>{name}</Title>
          <Text muted size={12}>تطبيق الموبايل</Text>
        </View>
      ) : null}
    </View>
  );
}
