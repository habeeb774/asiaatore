import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button } from '../components/UI';
import { API_BASE } from '../lib/config';
import api from '../lib/api';
import { Header } from '../components/Header';
import { ListItem } from '../components/ListItem';
import ProductCard from '../components/ProductCard';

async function fetchProducts() {
  const data = await api.listProducts();
  return Array.isArray(data) ? data : (data.items || []);
}

export default function Home() {
  const { data, isLoading, error } = useQuery({ queryKey: ['products'], queryFn: fetchProducts, retry: 1 });
  return (
    <Screen style={{ gap: 12 }}>
      <Header />
      <Title>المنتجات</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>خطأ في التحميل</Text>}
      <Text muted size={12}>API: {API_BASE}</Text>
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
