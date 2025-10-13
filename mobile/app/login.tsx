import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Title, Button, Text } from '../components/UI';
import { API_BASE } from '../lib/config';

export default function Login() {
  // In dev, the API supports fallback credentials when DEBUG_LOGIN=1 or ALLOW_INVALID_DB=true
  // Defaults below match server DEV_USERS in server/routes/auth.js
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'FAILED');
      if (data?.accessToken) {
        try { await AsyncStorage.setItem('my_store_token', data.accessToken); } catch {}
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert('فشل الدخول', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ gap: 8 }}>
      <Title>تسجيل الدخول</Title>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="البريد الإلكتروني" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="كلمة المرور" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }} />
      <Button title={loading ? '...' : 'دخول'} onPress={submit} />
      <Text muted size={12}>سيتم حفظ التوكن محليًا للاستخدام لاحقًا</Text>
      <Text muted size={11}>ملاحظة: في وضع التطوير جرّب البريد: admin@example.com وكلمة المرور: admin123</Text>
    </Screen>
  );
}
