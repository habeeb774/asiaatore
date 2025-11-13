import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Placeholder: استبدله لاحقاً بالمنطق الحقيقي (مثلاً:
 *  - polling كل X ثوانٍ
 *  - الاشتراك بقناة WebSocket
 *  - الاستماع لرسائل postMessage من بوابة دفع
 */
export default function PaymentStatusWatcher({
  intervalMs = 15000,
  onRefresh,
  autoStart = true
}) {
  const timerRef = useRef(null);
  const toast = useToast?.() || null;

  useEffect(() => {
    if (!autoStart) return;
    const tick = () => {
      try {
        onRefresh && onRefresh();
        // ضع هنا استدعاء API حقيقي مثلاً:
        // fetch('/api/payment-status').then(r=>r.json()).then(...)
      } catch (e) {
        console.warn('[PaymentStatusWatcher] silent error', e);
        try { toast?.error?.('فشل تحديث الدفع', e?.message || 'حدث خطأ غير متوقع'); } catch {}
      }
    };
    tick();
    timerRef.current = setInterval(tick, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [intervalMs, onRefresh, autoStart, toast]);

  return null;
}
