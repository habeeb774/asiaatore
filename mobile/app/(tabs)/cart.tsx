import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Screen, Title, Text, Button } from '../../components/UI';
import { useCart } from '../../context/CartContext';

export default function CartScreen() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  return (
    <Screen>
      <Title>سلة التسوق</Title>
      <FlatList
        data={cartItems}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text muted>السلة فارغة</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
            <Text>{(item as any)?.name?.ar || (item as any)?.name?.en || String(item.id)}</Text>
            <Text muted>الكمية: {item.quantity}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="-" variant="secondary" onPress={() => updateQuantity(String(item.id), Math.max(0, (item.quantity||0)-1))} />
              <Button title="+" onPress={() => updateQuantity(String(item.id), (item.quantity||0)+1)} />
              <Button title="حذف" variant="secondary" onPress={() => removeFromCart(String(item.id))} />
            </View>
          </View>
        )}
      />
      {cartItems.length > 0 && (
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text>الإجمالي: {cartTotal.toFixed(2)} ر.س</Text>
          <Button title="تفريغ السلة" variant="secondary" onPress={clearCart} />
        </View>
      )}
    </Screen>
  );
}
