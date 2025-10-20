import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Text, Button, Card } from '../../components/UI';
import { api, DeliveryOrder } from '../../lib/api';
import { useDeliveryActions } from '../../hooks/useDeliveryActions';
import { CompleteModal, FailModal } from '../../components/DeliveryModals';
import { useToast } from '../../context/ToastContext';

function makeRouter() {
	// try to require expo-router at runtime
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const r = require('expo-router');
		// Expo Router exports `router`, or exposes push on default export
		if (r && r.router) return r.router;
		if (r && r.default && typeof r.default.push === 'function') return r.default;
		return r;
	} catch {
		// fallback router that maps push() to Linking.openURL
		return {
			push(target: string | { pathname?: string; params?: Record<string, any> }) {
				if (typeof target === 'string') {
					Linking.openURL(target).catch(() => {});
					return;
				}
				let path = target.pathname ?? '/';
				// replace params in path like /delivery/order/[id]
				if (target.params) {
					Object.keys(target.params).forEach((k) => {
						const val = String(target.params![k]);
						path = path.replace(`[${k}]`, encodeURIComponent(val));
					});
					// append any params not replaced as query string
					const unreplaced = Object.keys(target.params).filter((k) => !path.includes(encodeURIComponent(String(target.params![k]))));
					if (unreplaced.length) {
						const qs = unreplaced.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(target.params![k]))}`).join('&');
						path = path + (path.includes('?') ? '&' : '?') + qs;
					}
				}
				Linking.openURL(path).catch(() => {});
			},
		};
	}
}

const router = makeRouter();

const statusLabels: Record<string, string> = {
  unassigned: 'بانتظار سائق',
  assigned: 'مسند',
  accepted: 'تم القبول',
  out_for_delivery: 'جارٍ التوصيل',
  delivered: 'تم التسليم',
  failed: 'محاولة فاشلة',
  canceled: 'ملغي',
};

const statusColors: Record<string, { bg: string; fg: string }> = {
  unassigned: { bg: '#f1f5f9', fg: '#475569' },
  assigned: { bg: '#dbeafe', fg: '#1d4ed8' },
  accepted: { bg: '#c7d2fe', fg: '#3730a3' },
  out_for_delivery: { bg: '#fef3c7', fg: '#b45309' },
  delivered: { bg: '#dcfce7', fg: '#15803d' },
  failed: { bg: '#fee2e2', fg: '#b91c1c' },
  canceled: { bg: '#e2e8f0', fg: '#64748b' },
};

function StatusBadge({ status }: { status: string }) {
  const info = statusColors[status] || { bg: '#e2e8f0', fg: '#475569' };
  const label = statusLabels[status] || status;
  return (
    <View style={{ backgroundColor: info.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Text size={12} style={{ color: info.fg }}>{label}</Text>
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-SA', { hour12: false });
  } catch {
    return value;
  }
}

const tabs: Array<{ key: 'assigned' | 'pool' | 'history'; label: string }> = [
  { key: 'assigned', label: 'مهامي' },
  { key: 'pool', label: 'طلبات متاحة' },
  { key: 'history', label: 'السجل' },
];

export default function DeliveryHome() {
  const toast = useToast();
  const [tab, setTab] = useState<'assigned' | 'pool' | 'history'>('assigned');
  const [completeOrder, setCompleteOrder] = useState<DeliveryOrder | null>(null);
  const [failOrder, setFailOrder] = useState<DeliveryOrder | null>(null);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => api.me(), retry: false });
  const userRole = meQuery.data?.user?.role;
  const canAccess = userRole === 'delivery' || userRole === 'admin';

  const assignedQuery = useQuery({
    queryKey: ['delivery', 'assigned'],
    queryFn: api.deliveryAssigned,
    enabled: canAccess,
    staleTime: 15_000,
  });

  const poolQuery = useQuery({
    queryKey: ['delivery', 'pool'],
    queryFn: api.deliveryPool,
    enabled: canAccess && tab === 'pool',
    staleTime: 12_000,
  });

  const historyQuery = useQuery({
    queryKey: ['delivery', 'history'],
    queryFn: () => api.deliveryHistory(),
    enabled: canAccess && tab === 'history',
    staleTime: 60_000,
  });

  const actions = useDeliveryActions();

  const counts = {
    assigned: assignedQuery.data?.length ?? 0,
    pool: poolQuery.data?.length ?? 0,
    history: historyQuery.data?.length ?? 0,
  };
  const hasCounts = {
    assigned: assignedQuery.data !== undefined,
    pool: poolQuery.data !== undefined,
    history: historyQuery.data !== undefined,
  };

  const currentQuery = tab === 'assigned' ? assignedQuery : tab === 'pool' ? poolQuery : historyQuery;
  const orders: DeliveryOrder[] = currentQuery.data ?? [];
  const loading = currentQuery.isLoading || currentQuery.isFetching;

  const onRefresh = () => {
    if (currentQuery.refetch) currentQuery.refetch();
  };

  const handleUpdateLocation = async (order: DeliveryOrder) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show({ type: 'warn', title: 'لم يتم منح صلاحية الموقع', description: 'السماح بالموقع ضروري لإرسال آخر موقع لك.' });
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

  const openDetails = (orderId: string) => {
    router.push({ pathname: '/delivery/order/[id]', params: { id: orderId } });
  };

  const renderOrder = ({ item }: { item: DeliveryOrder }) => {
    const actionsForOrder = [] as Array<{ title: string; variant?: 'primary' | 'secondary' | 'ghost'; onPress: () => void; disabled?: boolean }>;

    if (tab !== 'history') {
      actionsForOrder.push({ title: 'عرض التفاصيل', variant: 'ghost', onPress: () => openDetails(item.id) });
    }

    if (item.deliveryStatus === 'unassigned') {
      actionsForOrder.push({ title: 'قبول الطلب', onPress: () => actions.accept.mutate(item.id), disabled: actions.accept.isPending });
    }

    if (item.deliveryStatus === 'assigned') {
      actionsForOrder.push({ title: 'تأكيد القبول', onPress: () => actions.accept.mutate(item.id), disabled: actions.accept.isPending });
      actionsForOrder.push({ title: 'رفض / إرجاع الطلب', variant: 'secondary', onPress: () => actions.reject.mutate(item.id), disabled: actions.reject.isPending });
    }

    if (item.deliveryStatus === 'accepted') {
      actionsForOrder.push({ title: 'بدء التوصيل', onPress: () => actions.start.mutate(item.id), disabled: actions.start.isPending });
      actionsForOrder.push({ title: 'إرجاع الطلب', variant: 'secondary', onPress: () => actions.reject.mutate(item.id), disabled: actions.reject.isPending });
    }

    if (item.deliveryStatus === 'out_for_delivery') {
      actionsForOrder.push({ title: 'تحديث موقعي الآن', variant: 'ghost', onPress: () => handleUpdateLocation(item), disabled: actions.updateLocation.isPending });
      actionsForOrder.push({ title: 'إنهاء بالتسليم', onPress: () => setCompleteOrder(item) });
      actionsForOrder.push({ title: 'محاولة فاشلة', variant: 'secondary', onPress: () => setFailOrder(item) });
    }

    const total = item.grandTotal ?? null;

    return (
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>#{item.id}</Text>
          <StatusBadge status={item.deliveryStatus} />
        </View>
        <View style={{ gap: 4 }}>
          <Text muted size={13}>الطلب: {total !== null ? `${total.toFixed(2)} ر.س` : '—'}</Text>
          <Text muted size={13}>تحديث أخير: {formatDate(item.updatedAt)}</Text>
          <Text muted size={13}>إنشاء: {formatDate(item.createdAt)}</Text>
          {item.outForDeliveryAt ? <Text muted size={12}>بداية التوصيل: {formatDate(item.outForDeliveryAt)}</Text> : null}
        </View>
        {actionsForOrder.length ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {actionsForOrder.map((action, idx) => (
              <Button key={`${item.id}-${idx}`} title={action.title} variant={action.variant} onPress={action.onPress} disabled={action.disabled} />
            ))}
          </View>
        ) : null}
      </Card>
    );
  };

  if (meQuery.isLoading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text muted style={{ marginTop: 12 }}>جارٍ التحقق من الحساب...</Text>
      </Screen>
    );
  }

  if (!canAccess) {
    return (
      <Screen style={{ gap: 12 }}>
        <Title>مهام التوصيل</Title>
        <Text muted>هذه الواجهة مخصصة لمندوبي التوصيل. تأكد من تسجيل الدخول بحساب السائق.</Text>
        <Button title="تسجيل الدخول" onPress={() => router.push('/login')} />
      </Screen>
    );
  }

  const emptyComponent = !loading ? (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <Text muted>لا توجد طلبات في هذا القسم الآن.</Text>
    </View>
  ) : null;

  return (
    <Screen style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Title>مهام التوصيل</Title>
        <Text muted size={13}>مرحبًا {meQuery.data?.user?.name || 'بك'}، تابع حالة الطلبات وقم بتحديثها في الوقت الحقيقي.</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4 }}>
        {tabs.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key];
          const showCount = hasCounts[t.key] || active;
          const label = showCount ? `${t.label} (${count})` : t.label;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: active ? '#fff' : 'transparent' }}
            >
              <Text style={{ color: active ? '#111827' : '#475569', fontWeight: active ? '700' : '500' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !orders.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 64 }}
          renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={loading && orders.length > 0} onRefresh={onRefresh} />}
          ListEmptyComponent={emptyComponent}
        />
      )}

      <CompleteModal
        visible={!!completeOrder}
        onClose={() => setCompleteOrder(null)}
        onSubmit={async (payload) => {
          if (!completeOrder) return;
          await actions.complete.mutateAsync({ id: completeOrder.id, note: payload.note, proofUri: payload.proofUri });
        }}
      />
      <FailModal
        visible={!!failOrder}
        onClose={() => setFailOrder(null)}
        onSubmit={async (reason) => {
          if (!failOrder) return;
          await actions.fail.mutateAsync({ id: failOrder.id, reason });
        }}
      />
    </Screen>
  );
}
