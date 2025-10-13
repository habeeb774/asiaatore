import React from 'react';
import { FlatList, Image, View, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text } from '../../components/UI';
import { API_BASE } from '../../lib/config';
import { router } from 'expo-router';

async function fetchBrands() {
  const r = await fetch(`${API_BASE}/brands`);
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || []);
}

function toAbsolute(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE.replace(/\/?api\/?$/, '') + url;
}

export default function Brands() {
  const { data, isLoading, error } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  return (
    <Screen>
      <Title>العلامات التجارية</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>تعذر تحميل العلامات</Text>}
      <FlatList
        data={data || []}
        keyExtractor={(b: any) => String(b.id || b.slug)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const logo = toAbsolute(item.logoVariants?.thumb || item.logo);
          return (
            <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: item.slug || item.id } })}
            >
            <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap: 10, padding: 10, borderWidth:1, borderColor:'rgba(0,0,0,0.08)', borderRadius: 10 }}>
              {logo ? <Image source={{ uri: logo }} style={{ width: 40, height: 40, borderRadius: 8 }} /> : null}
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight: '700' }}>{item.name?.ar || item.name?.en || item.slug}</Text>
                <Text muted size={12}>{item.productCount ? `${item.productCount} منتج` : ''}</Text>
              </View>
            </View>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}
