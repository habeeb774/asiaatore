import React from 'react';
import { FlatList, TouchableOpacity, Image, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button } from '../../components/UI';
import { API_BASE } from '../../lib/config';
import { ListItem } from '../../components/ListItem';

async function fetchBrandProducts(slug: string) {
  const r = await fetch(`${API_BASE}/products?brandSlug=${encodeURIComponent(slug)}`);
  if (!r.ok) throw new Error('Failed');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || []);
}

async function fetchBrand(slug: string) {
  const r = await fetch(`${API_BASE}/brands/slug/${encodeURIComponent(slug)}`);
  if (!r.ok) return null;
  return await r.json();
}

function abs(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE.replace(/\/?api\/?$/, '') + url;
}

export default function BrandProducts() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: productsRaw, isLoading, error } = useQuery({ queryKey: ['brand-products', slug], queryFn: () => fetchBrandProducts(slug!) });
  const { data: brand } = useQuery({ queryKey: ['brand', slug], queryFn: () => fetchBrand(slug!), staleTime: 10 * 60_000 });
  const [sort, setSort] = React.useState<'new' | 'priceAsc' | 'priceDesc'>('new');
  const products = React.useMemo(() => {
    const arr = Array.isArray(productsRaw) ? [...productsRaw] : [];
    if (sort === 'priceAsc') arr.sort((a: any, b: any) => Number(a.price||0) - Number(b.price||0));
    else if (sort === 'priceDesc') arr.sort((a: any, b: any) => Number(b.price||0) - Number(a.price||0));
    // 'new' assumed server is already sorted by createdAt desc; fallback no-op
    return arr;
  }, [productsRaw, sort]);
  return (
    <Screen>
      <View style={{ flexDirection:'row', alignItems:'center', gap: 10, marginBottom: 8 }}>
        {brand?.logo ? (
          <Image source={{ uri: abs(brand.logoVariants?.thumb || brand.logo)! }} style={{ width: 36, height: 36, borderRadius: 8 }} />
        ) : null}
        <View>
          <Title>{brand?.name?.ar || brand?.name?.en || 'منتجات العلامة'}</Title>
          {brand?.productCount != null ? <Text muted size={12}>{brand.productCount} منتج</Text> : null}
        </View>
      </View>
      {isLoading && <Text>جار التحميل...</Text>}
      {error && <Text muted>تعذر تحميل منتجات العلامة</Text>}
      {!isLoading && !error ? (
        <View style={{ flexDirection:'row', gap: 8, marginBottom: 8 }}>
          <Button title={sort==='new'?'الأحدث ✓':'الأحدث'} variant={sort==='new'?'primary':'ghost'} onPress={()=>setSort('new')} />
          <Button title={sort==='priceAsc'?'السعر ↑ ✓':'السعر ↑'} variant={sort==='priceAsc'?'primary':'ghost'} onPress={()=>setSort('priceAsc')} />
          <Button title={sort==='priceDesc'?'السعر ↓ ✓':'السعر ↓'} variant={sort==='priceDesc'?'primary':'ghost'} onPress={()=>setSort('priceDesc')} />
        </View>
      ) : null}
      <FlatList
        data={products || []}
        keyExtractor={(item: any) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ flex:1 }} onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(item.id) } })}>
            <View style={{ flex:1, gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, padding: 10 }}>
              {item.image ? (
                <Image source={{ uri: abs(item.image)! }} style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f6f6f6' }} />
              ) : null}
              <Text style={{ fontWeight: '700' }} numberOfLines={2}>{item.name?.ar || item.name?.en || item.slug}</Text>
              <Text muted size={12}>{item.price} ر.س</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}
