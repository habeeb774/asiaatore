import React, { useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, Button } from './UI';
import { API_BASE } from '../lib/config';
import { useCart } from '../context/CartContext';

function abs(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  // remove trailing /api from base then append
  return API_BASE.replace(/\/api\/?$/, '') + url;
}

export default function ProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const img = Array.isArray(product?.images) && product.images.length ? product.images[0] : (product?.image || null);
  const uri = abs(img || undefined) || undefined;
  const outOfStock = Number(product?.stock || 0) <= 0;
  const name = product?.name?.ar || product?.name?.en || product?.slug || String(product?.id);

  return (
    <TouchableOpacity style={{ flex:1 }} onPress={onPress} disabled={adding}>
      <View style={{ flex:1, gap: 8, borderWidth:1, borderColor:'rgba(0,0,0,0.08)', borderRadius: 10, padding: 10 }}>
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f6f6f6' }} />
        ) : (
          <View style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems:'center', justifyContent:'center' }}>
            <Text muted size={12}>لا توجد صورة</Text>
          </View>
        )}
        <Text numberOfLines={2} style={{ fontWeight:'700' }}>{name}</Text>
        <Text muted>{Number(product?.price||0)} ر.س</Text>
        <Button
          title={outOfStock ? 'غير متوفر' : (adding ? '...' : 'أضف إلى السلة')}
          onPress={async () => {
            if (outOfStock || adding) return;
            setAdding(true);
            try { const r = addToCart(product, 1); } finally { setAdding(false); }
          }}
          disabled={outOfStock || adding}
        />
      </View>
    </TouchableOpacity>
  );
}
