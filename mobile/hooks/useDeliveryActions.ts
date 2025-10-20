import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

type CompletePayload = { id: string; note?: string; proofUri?: string | null };
type FailPayload = { id: string; reason: string };
type LocationPayload = { id: string; coords: { lat?: number; lng?: number; accuracy?: number | null; heading?: number | null; speed?: number | null } };
type StatusPayload = { id: string; status: string };
type OtpConfirmPayload = { id: string; code: string };

function messageFromError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message as string;
  }
  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}

export function useDeliveryActions() {
  const toast = useToast();
  const qc = useQueryClient();

  const invalidateLists = useCallback(async (id?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['delivery', 'assigned'] }),
      qc.invalidateQueries({ queryKey: ['delivery', 'pool'] }),
      qc.invalidateQueries({ queryKey: ['delivery', 'history'] }),
      id ? qc.invalidateQueries({ queryKey: ['delivery', 'order', id] }) : Promise.resolve(),
    ]);
  }, [qc]);

  const handleError = useCallback((err: unknown) => {
    toast.show({ type: 'error', title: 'خطأ', description: messageFromError(err) });
  }, [toast]);

  const accept = useMutation({
    mutationFn: (id: string) => api.deliveryAccept(id),
    onSuccess: async (_data, id) => {
      toast.show({ type: 'success', title: 'تم قبول الطلب' });
      await invalidateLists(id);
    },
    onError: handleError,
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.deliveryReject(id),
    onSuccess: async (_data, id) => {
      toast.show({ type: 'info', title: 'تم إعادة الطلب إلى قائمة الانتظار' });
      await invalidateLists(id);
    },
    onError: handleError,
  });

  const start = useMutation({
    mutationFn: (id: string) => api.deliveryStart(id),
    onSuccess: async (_data, id) => {
      toast.show({ type: 'success', title: 'تم بدء التوصيل' });
      await invalidateLists(id);
    },
    onError: handleError,
  });

  const complete = useMutation({
    mutationFn: (payload: CompletePayload) => api.deliveryComplete(payload.id, payload),
    onSuccess: async (_data, payload) => {
      toast.show({ type: 'success', title: 'تم إغلاق الطلب بالتسليم' });
      await invalidateLists(payload.id);
    },
    onError: handleError,
  });

  const fail = useMutation({
    mutationFn: (payload: FailPayload) => api.deliveryFail(payload.id, payload.reason),
    onSuccess: async (_data, payload) => {
      toast.show({ type: 'warn', title: 'تم تسجيل محاولة فاشلة', description: payload.reason });
      await invalidateLists(payload.id);
    },
    onError: handleError,
  });

  const updateLocation = useMutation({
    mutationFn: (payload: LocationPayload) => api.deliveryLocation(payload.id, payload.coords),
    onSuccess: async (_data, payload) => {
      toast.show({ type: 'success', title: 'تم تحديث الموقع الحالي' });
      await invalidateLists(payload.id);
    },
    onError: handleError,
  });

  const statusPatch = useMutation({
    mutationFn: (payload: StatusPayload) => api.deliveryStatusPatch(payload.id, payload.status),
    onSuccess: async (_data, payload) => {
      toast.show({ type: 'success', title: 'تم تحديث حالة التسليم' });
      await invalidateLists(payload.id);
    },
    onError: handleError,
  });

  const otpGenerate = useMutation({
    mutationFn: (id: string) => api.deliveryOtpGenerate(id),
    onSuccess: (data) => {
      const hint = data?.hint ? String(data.hint) : undefined;
      toast.show({ type: 'info', title: 'تم توليد رمز OTP', description: hint ? `الرمز: ${hint}` : 'أبلغ العميل بالرمز للتحقق عند التسليم.' });
      // No need to invalidate lists for OTP
    },
    onError: handleError,
  });

  const otpConfirm = useMutation({
    mutationFn: (payload: OtpConfirmPayload) => api.deliveryOtpConfirm(payload.id, payload.code),
    onSuccess: async (_data, payload) => {
      toast.show({ type: 'success', title: 'تم تأكيد رمز OTP' });
      await invalidateLists(payload.id);
    },
    onError: handleError,
  });

  return {
    accept,
    reject,
    start,
    complete,
    fail,
    updateLocation,
    statusPatch,
    otpGenerate,
    otpConfirm,
  };
}
