import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button } from '../../components/UI';
import { API_BASE } from '../../lib/config';

async function fetchProduct(id: string) {
  const r = await fetch(`${API_BASE}/products/${id}`);
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return data?.product || data;
}

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => fetchProduct(id!) });
  if (isLoading) return <Screen><Text>جار التحميل...</Text></Screen>;
  return (
    <Screen style={{ gap: 8 }}>
      <Title>{data?.name?.ar || data?.name?.en}</Title>
      <Text>السعر: {data?.price} ر.س</Text>
      <Button title="رجوع" onPress={() => router.back()} />
    </Screen>
  );
}
