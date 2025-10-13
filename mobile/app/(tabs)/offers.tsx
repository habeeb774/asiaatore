import React from 'react';
import { FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text } from '../../components/UI';
import { API_BASE } from '../../lib/config';
import { router } from 'expo-router';
import ProductCard from '../../components/ProductCard';

async function fetchOffers() {
  const r = await fetch(`${API_BASE}/products/offers`);
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || []);
}

export default function Offers() {
  const { data, isLoading, error } = useQuery({ queryKey: ['offers'], queryFn: fetchOffers });
  return (
    <Screen>
      <Title>العروض</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>تعذر تحميل العروض</Text>}
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(item.id) } })} />
        )}
      />
    </Screen>
  );
}
