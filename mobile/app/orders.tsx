import React from 'react';
import { View, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Title, Text } from '../components/UI';
import { API_BASE } from '../lib/config';

async function fetchOrders() {
  const token = await AsyncStorage.getItem('my_store_token');
  const r = await fetch(`${API_BASE}/orders`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return data?.orders || [];
}

export default function Orders() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
  return (
    <Screen>
      <Title>طلباتي</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      <FlatList
        data={data}
        keyExtractor={(o: any) => String(o.id)}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
            <Text>#{item.id} — {new Date(item.createdAt).toLocaleString()}</Text>
            <Text muted>الإجمالي: {item.total || item.grandTotal} ر.س — الحالة: {item.status}</Text>
          </View>
        )}
      />
    </Screen>
  );
}
