import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const m: Record<string, any> = {
            home: 'home-outline',
            categories: 'grid-outline',
            brands: 'pricetags-outline',
            stores: 'storefront-outline',
            offers: 'flash-outline',
            cart: 'cart-outline',
            account: 'person-outline',
          };
          const name = m[route.name] || 'ellipse-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="categories" options={{ title: 'التصنيفات' }} />
      <Tabs.Screen name="brands" options={{ title: 'العلامات' }} />
      <Tabs.Screen name="stores" options={{ title: 'المتاجر' }} />
      <Tabs.Screen name="offers" options={{ title: 'العروض' }} />
  <Tabs.Screen name="cart" options={{ title: 'السلة' }} />
      <Tabs.Screen name="account" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
