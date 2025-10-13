import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button } from '../../components/UI';
import { useCart } from '../../context/CartContext';
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
  const { addToCart } = useCart();
  if (isLoading) return <Screen><Text>جار التحميل...</Text></Screen>;
  const outOfStock = Number(data?.stock || 0) <= 0;
  return (
    <Screen style={{ gap: 8 }}>
      <Title>{data?.name?.ar || data?.name?.en}</Title>
      <Text>السعر: {data?.price} ر.س</Text>
      <Button title={outOfStock ? 'غير متوفر' : 'أضف إلى السلة'} onPress={() => { if (outOfStock) return; const r = addToCart(data, 1); if (r?.ok) router.push('/(tabs)/cart'); }} disabled={outOfStock} />
      <Button title="رجوع" onPress={() => router.back()} />
    </Screen>
  );
}
