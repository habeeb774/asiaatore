import React from 'react';
import { FlatList, Image, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text } from '../../components/UI';
import { API_BASE } from '../../lib/config';

async function fetchStores() {
  // Try a hypothetical public stores endpoint first
  try {
    const r = await fetch(`${API_BASE}/stores`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) || data?.items) return Array.isArray(data) ? data : data.items;
    }
  } catch {}
  // Fallback: show brands as stores placeholder
  const r2 = await fetch(`${API_BASE}/brands`);
  if (!r2.ok) throw new Error('Failed');
  const data2 = await r2.json();
  const list = Array.isArray(data2) ? data2 : (data2.items || []);
  return list.map((b: any) => ({ id: b.id, name: b.name, logo: b.logoVariants?.medium || b.logo, productCount: b.productCount }));
}

function toAbsolute(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE.replace(/\/?api\/?$/, '') + url;
}

export default function Stores() {
  const { data, isLoading, error } = useQuery({ queryKey: ['stores'], queryFn: fetchStores });
  return (
    <Screen>
      <Title>المتاجر</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>تعذر تحميل المتاجر</Text>}
      <FlatList
        data={data || []}
        keyExtractor={(s: any) => String(s.id)}
        renderItem={({ item }) => {
          const logo = toAbsolute(item.logo);
          return (
            <View style={{ flexDirection:'row', alignItems:'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
              {logo ? <Image source={{ uri: logo }} style={{ width: 44, height: 44, borderRadius: 8 }} /> : null}
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight: '700' }}>{item.name?.ar || item.name?.en}</Text>
                {item.productCount != null ? <Text muted size={12}>{item.productCount} منتج</Text> : null}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
