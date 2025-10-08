import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button } from '../components/UI';
import { API_BASE } from '../lib/config';
import { Header } from '../components/Header';
import { ListItem } from '../components/ListItem';

async function fetchProducts() {
  const r = await fetch(`${API_BASE}/products`);
  if (!r.ok) throw new Error('Failed to load');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || []);
}

export default function Home() {
  const { data, isLoading, error } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  return (
    <Screen style={{ gap: 12 }}>
      <Header />
      <Title>المنتجات</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>خطأ في التحميل</Text>}
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(item.id) } })}>
            <ListItem title={item.name?.ar || item.name?.en || item.slug || String(item.id)} subtitle={`${item.price} ر.س`} />
          </TouchableOpacity>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Link href="/login" asChild>
          <Button title="تسجيل الدخول" onPress={() => {}} />
        </Link>
        <Link href="/orders" asChild>
          <Button title="طلباتي" variant="secondary" onPress={() => {}} />
        </Link>
      </View>
    </Screen>
  );
}
