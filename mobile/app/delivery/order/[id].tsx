import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import useLocalSearchParams, { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button, Card } from '../../../components/UI';
import { api, DeliveryOrder } from '../../../lib/api';
import { useDeliveryActions } from '../../../hooks/useDeliveryActions';
import { CompleteModal, FailModal } from '../../../components/DeliveryModals';
import { useToast } from '../../../context/ToastContext';
import DeliveryMap, { MapHandle } from '../../../components/DeliveryMap';

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-SA', { hour12: false });
  } catch {
    return value;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    unassigned: { label: 'بانتظار سائق', bg: '#f1f5f9', fg: '#475569' },
    assigned: { label: 'مسند', bg: '#dbeafe', fg: '#1d4ed8' },
    accepted: { label: 'تم القبول', bg: '#c7d2fe', fg: '#3730a3' },
    out_for_delivery: { label: 'جارٍ التوصيل', bg: '#fef3c7', fg: '#b45309' },
    delivered: { label: 'تم التسليم', bg: '#dcfce7', fg: '#15803d' },
    failed: { label: 'محاولة فاشلة', bg: '#fee2e2', fg: '#b91c1c' },
    canceled: { label: 'ملغي', bg: '#e2e8f0', fg: '#64748b' },
  };
  const info = map[status] || { label: status, bg: '#e2e8f0', fg: '#111827' };
  return (
    <View style={{ backgroundColor: info.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text size={12} style={{ color: info.fg }}>{info.label}</Text>
    </View>
  );
}

function extractCoordinates(raw: any): { lat: number; lng: number } | null {
  if (!raw) return null;
  const normalize = (value: any): any => {
    if (!value) return null;
    if (Array.isArray(value)) {
      if (value.length >= 2) return { lat: value[0], lng: value[1] };
      return null;
    }
    if (typeof value === 'object') {
      if (value.location) return normalize(value.location);
      if (value.coords) return normalize(value.coords);
      if (value.position) return normalize(value.position);
    }
    return value;
  };
  const source = normalize(raw);
  if (!source || typeof source !== 'object') return null;
  const toNumber = (input: any): number | null => {
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    if (typeof input === 'string' && input.trim()) {
      const num = Number(input);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  };
  const lat = toNumber((source as any).lat ?? (source as any).latitude ?? (source as any).Lat ?? (source as any).Latitude ?? null);
  const lng = toNumber((source as any).lng ?? (source as any).lon ?? (source as any).longitude ?? (source as any).Lon ?? (source as any).Longitude ?? null);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export default function DeliveryOrderDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const toast = useToast();
  const [completeOrder, setCompleteOrder] = useState<DeliveryOrder | null>(null);
  const [failOrder, setFailOrder] = useState<DeliveryOrder | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [mapHandle, setMapHandle] = useState<MapHandle | null>(null);

  const query = useQuery({
    queryKey: ['delivery', 'order', id],
    queryFn: () => api.deliveryGet(String(id)),
    enabled: !!id,
  });

  const actions = useDeliveryActions();
  const order = query.data;
  const isActive = !!order && ['accepted', 'out_for_delivery'].includes(order.deliveryStatus);

  const addressText = useMemo(() => {
    if (!order) return null;
    const raw = (order as any).shippingAddress || (order as any).address || null;
    if (!raw || typeof raw !== 'object') return null;
    const parts = [raw.name, raw.district, raw.city, raw.street, raw.building, raw.apartment, raw.notes]
      .map((part) => (typeof part === 'string' && part.trim().length ? part.trim() : null))
      .filter(Boolean);
    return parts.length ? parts.join('، ') : null;
  }, [order]);

  const timeline = useMemo(() => {
    if (!order) return [];
    return [
      { label: 'قبول السائق', value: order.acceptedAt },
      { label: 'بداية التوصيل', value: order.outForDeliveryAt },
      { label: 'اكتمل التسليم', value: order.deliveredAt },
      { label: 'محاولة فاشلة', value: order.failedAt },
    ].filter((step) => step.value);
  }, [order]);

  const locationText = useMemo(() => {
    if (!order || !(order as any).deliveryLocation) return null;
    const loc = (order as any).deliveryLocation;
    if (typeof loc !== 'object') return null;
    const lat = typeof loc.lat === 'number' ? loc.lat.toFixed(6) : null;
    const lng = typeof loc.lng === 'number' ? loc.lng.toFixed(6) : null;
    if (!lat || !lng) return null;
    return `خط العرض ${lat}، خط الطول ${lng}`;
  }, [order]);

  const driverCoords = useMemo(() => {
    if (!order) return null;
    return extractCoordinates((order as any).deliveryLocation || null);
  }, [order]);

  const destinationCoords = useMemo(() => {
    if (!order) return null;
    const raw: any = order;
    return (
      extractCoordinates(raw.destination) ||
      extractCoordinates(raw.destinationLocation) ||
      extractCoordinates(raw.shippingAddress?.location) ||
      extractCoordinates(raw.shippingAddress) ||
      extractCoordinates(raw.address?.location) ||
      extractCoordinates(raw.address) ||
      extractCoordinates({ lat: raw.shippingLat, lng: raw.shippingLng }) ||
      extractCoordinates({ lat: raw.shippingLatitude, lng: raw.shippingLongitude }) ||
      extractCoordinates({ lat: raw.destLat, lng: raw.destLng })
    );
  }, [order]);

  const handleUpdateLocation = async () => {
    if (!order) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show({ type: 'warn', title: 'لم يتم منح صلاحية الموقع' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await actions.updateLocation.mutateAsync({
        id: order.id,
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
        },
      });
    } catch (err) {
      toast.show({ type: 'error', title: 'تعذر تحديث الموقع', description: err instanceof Error ? err.message : undefined });
    }
  };

  const handleOpenInMaps = useCallback(() => {
    const destination = destinationCoords || driverCoords;
    if (!destination) {
      toast.show({ type: 'warn', title: 'لا توجد إحداثيات متاحة' });
      return;
    }
    const destParam = `${destination.lat},${destination.lng}`;
    const originParam = driverCoords ? `${driverCoords.lat},${driverCoords.lng}` : null;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destParam)}`;
    if (originParam) url += `&origin=${encodeURIComponent(originParam)}`;
    Linking.openURL(url).catch(() => {
      toast.show({ type: 'error', title: 'تعذر فتح الخرائط' });
    });
  }, [destinationCoords, driverCoords, toast]);

  const primaryActions = useMemo(() => {
    if (!order) return [] as Array<{ title: string; variant?: 'primary' | 'secondary' | 'ghost'; onPress: () => void; disabled?: boolean }>;
    const list: Array<{ title: string; variant?: 'primary' | 'secondary' | 'ghost'; onPress: () => void; disabled?: boolean }> = [];
    if (order.deliveryStatus === 'unassigned') {
      list.push({ title: 'قبول الطلب', onPress: () => actions.accept.mutate(order.id), disabled: actions.accept.isPending });
    }
    if (order.deliveryStatus === 'assigned') {
      list.push({ title: 'تأكيد القبول', onPress: () => actions.accept.mutate(order.id), disabled: actions.accept.isPending });
      list.push({ title: 'رفض الطلب', variant: 'secondary', onPress: () => actions.reject.mutate(order.id), disabled: actions.reject.isPending });
    }
    if (order.deliveryStatus === 'accepted') {
      list.push({ title: 'بدء التوصيل', onPress: () => actions.start.mutate(order.id), disabled: actions.start.isPending });
      list.push({ title: 'إرجاع الطلب', variant: 'secondary', onPress: () => actions.reject.mutate(order.id), disabled: actions.reject.isPending });
    }
    if (order.deliveryStatus === 'out_for_delivery') {
      list.push({ title: 'تحديث موقعي الآن', variant: 'ghost', onPress: handleUpdateLocation, disabled: actions.updateLocation.isPending });
      list.push({ title: 'إنهاء بالتسليم', onPress: () => setCompleteOrder(order) });
      list.push({ title: 'محاولة فاشلة', variant: 'secondary', onPress: () => setFailOrder(order) });
    }
    return list;
  }, [order, actions.accept, actions.reject, actions.start, actions.updateLocation, handleUpdateLocation]);

  useEffect(() => {
    if (!mapHandle || !destinationCoords || !isActive) return;
    mapHandle.centerOnDestination();
  }, [mapHandle, destinationCoords, isActive]);

  if (query.isLoading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text muted style={{ marginTop: 12 }}>جارٍ تحميل تفاصيل الطلب...</Text>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen style={{ gap: 12 }}>
        <Title>تفاصيل الطلب</Title>
        <Text muted>لم يتم العثور على الطلب أو لم يعد متاحًا.</Text>
        <Button title="عودة" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const items = Array.isArray((order as any).items) ? (order as any).items as Array<any> : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Title>الطلب #{order.id}</Title>
          <Text muted>إجمالي الطلب: {order.grandTotal ? `${order.grandTotal.toFixed(2)} ر.س` : '—'}</Text>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>حالة التوصيل</Text>
            <StatusBadge status={order.deliveryStatus} />
          </View>
          <View style={{ marginTop: 12, gap: 6 }}>
            <Text muted>حالة الطلب الداخلية: {order.status || '—'}</Text>
            <Text muted>المستخدم: {order.userId || '—'}</Text>
            <Text muted>سائق التوصيل: {order.deliveryDriverId || '—'}</Text>
          </View>
        </Card>

        {addressText ? (
          <Card>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>عنوان التسليم</Text>
            <Text>{addressText}</Text>
          </Card>
        ) : null}

        {items.length ? (
          <Card>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>المنتجات</Text>
            <View style={{ gap: 6 }}>
              {items.map((p, idx) => (
                <View key={idx} style={{ borderBottomWidth: idx === items.length - 1 ? 0 : 1, borderColor: 'rgba(0,0,0,0.06)', paddingBottom: 6 }}>
                  <Text>{p?.name?.ar || p?.name || `منتج ${idx + 1}`}</Text>
                  <Text muted size={12}>الكمية: {p?.quantity ?? p?.qty ?? 1}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>الجدول الزمني</Text>
          <View style={{ gap: 6 }}>
            <Text muted>إنشاء الطلب: {formatDate(order.createdAt)}</Text>
            <Text muted>آخر تحديث: {formatDate(order.updatedAt)}</Text>
            {timeline.map((item) => (
              <Text key={item.label} muted>{item.label}: {formatDate(item.value as string)}</Text>
            ))}
          </View>
        </Card>

        {locationText ? (
          <Card>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>آخر موقع مُسجل</Text>
            <Text>{locationText}</Text>
          </Card>
        ) : null}

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>الخريطة الحية</Text>
          <DeliveryMap
            driverLocation={driverCoords}
            destination={destinationCoords}
            active={isActive}
            onHandle={setMapHandle}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Button title="Center on me" variant="ghost" onPress={() => mapHandle?.centerOnDriver()} disabled={!mapHandle || !driverCoords} />
            <Button title="Center on destination" variant="ghost" onPress={() => mapHandle?.centerOnDestination()} disabled={!mapHandle || !destinationCoords} />
            <Button title="Open in Maps" variant="secondary" onPress={handleOpenInMaps} disabled={!destinationCoords && !driverCoords} />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>إجراءات</Text>
          <View style={{ gap: 10 }}>
            <Button title="تحديث البيانات" variant="ghost" onPress={() => query.refetch()} />
            {primaryActions.map((act, idx) => (
              <Button key={idx} title={act.title} variant={act.variant} onPress={act.onPress} disabled={act.disabled} />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>رمز OTP للتسليم</Text>
          <View style={{ gap: 8 }}>
            <Button title="توليد رمز جديد" variant="secondary" onPress={() => actions.otpGenerate.mutate(order.id)} disabled={actions.otpGenerate.isPending} />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                placeholder="أدخل الرمز"
                style={{ flex: 1, borderWidth: 1, borderColor: '#cbd5f5', borderRadius: 12, padding: 12 }}
              />
              <Button
                title={actions.otpConfirm.isPending ? '...' : 'تأكيد'}
                onPress={async () => {
                  if (!otpCode.trim()) {
                    toast.show({ type: 'warn', title: 'أدخل الرمز أولاً' });
                    return;
                  }
                  await actions.otpConfirm.mutateAsync({ id: order.id, code: otpCode.trim() });
                  setOtpCode('');
                }}
                disabled={actions.otpConfirm.isPending}
              />
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button title="رجوع" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>

      <CompleteModal
        visible={!!completeOrder}
        onClose={() => setCompleteOrder(null)}
        onSubmit={async (payload) => {
          if (!completeOrder) return;
          await actions.complete.mutateAsync({ id: completeOrder.id, note: payload.note, proofUri: payload.proofUri });
          query.refetch();
        }}
      />
      <FailModal
        visible={!!failOrder}
        onClose={() => setFailOrder(null)}
        onSubmit={async (reason) => {
          if (!failOrder) return;
          await actions.fail.mutateAsync({ id: failOrder.id, reason });
          query.refetch();
        }}
      />
    </Screen>
  );
}
