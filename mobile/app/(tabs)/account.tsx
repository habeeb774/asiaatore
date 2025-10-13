import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Title, Text, Button } from '../../components/UI';
import { router } from 'expo-router';

export default function Account() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { (async () => setToken(await AsyncStorage.getItem('my_store_token')))(); }, []);
  return (
    <Screen style={{ gap: 12 }}>
      <Title>حسابي</Title>
      {token ? (
        <View style={{ gap: 8 }}>
          <Text>أنت مسجل دخولاً.</Text>
          <Button title="طلباتي" onPress={() => router.push('/orders')} />
          <Button title="تسجيل الخروج" variant="secondary" onPress={async () => { await AsyncStorage.removeItem('my_store_token'); setToken(null); }} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text muted>للاطلاع على طلباتك سجّل الدخول.</Text>
          <Button title="تسجيل الدخول" onPress={() => router.push('/login')} />
        </View>
      )}
    </Screen>
  );
}
