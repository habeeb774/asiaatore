import React from 'react';
import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text } from '../../components/UI';
import { API_BASE } from '../../lib/config';

async function fetchCategories() {
  const r = await fetch(`${API_BASE}/categories`);
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || data.categories || []);
}

export default function Categories() {
  const { data, isLoading, error } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  return (
    <Screen>
      <Title>التصنيفات</Title>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>تعذر تحميل التصنيفات</Text>}
      <FlatList
        data={data || []}
        keyExtractor={(c: any) => String(c.id || c.slug)}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
            <Text style={{ fontWeight: '700' }}>{item.name?.ar || item.name?.en || item.slug}</Text>
          </View>
        )}
      />
    </Screen>
  );
}
