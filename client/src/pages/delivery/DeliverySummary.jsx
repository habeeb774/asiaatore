import React, { useEffect, useMemo, useState } from 'react';
import RoutePlanner from '../../components/RoutePlanner';
import BarcodeScanner from '../../components/BarcodeScanner';
import SafetyTimer from '../../components/SafetyTimer';

// Lightweight Delivery Summary page
export default function DeliverySummary() {
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState('day'); // 'day' or 'week'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Try the delivery summary API; fallback gracefully if missing
    fetch(`/api/delivery/summary?range=${range}`)
      .then((r) => {
        if (!r.ok) throw new Error('no-summary');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        // Fallback: show placeholder counts until backend is added
        if (!cancelled) {
          setSummary({
            completed: 0,
            rejected: 0,
            failedAttempts: 0,
            revenue: 0,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => (cancelled = true);
  }, [range]);

  const points = useMemo(() => {
    if (!summary) return 0;
    // Simple points formula: 10 points per completed, -5 per rejected, +1 per 100 currency revenue
    return Math.max(0, summary.completed * 10 - summary.rejected * 5 + Math.floor((summary.revenue || 0) / 100));
  }, [summary]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">ملخص الرحلة</h1>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded ${range === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setRange('day')}
          >
            اليوم
          </button>
          <button
            className={`px-3 py-1 rounded ${range === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setRange('week')}
          >
            الأسبوع
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="المنجز" value={loading ? '...' : (summary?.completed ?? '-') } />
        <StatCard label="مرفوض" value={loading ? '...' : (summary?.rejected ?? '-') } />
        <StatCard label="محاولات فاشلة" value={loading ? '...' : (summary?.failedAttempts ?? '-') } />
        <StatCard label="الإيراد" value={loading ? '...' : `${summary?.revenue ?? '-'} SAR` } />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">لوحة الأداء</h2>
        <div className="p-4 bg-white rounded shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">النقاط المكتسبة</div>
            <div className="text-2xl font-bold">{points}</div>
          </div>
          <div>
            <a href="#rewards" className="text-primary-600">عرض المكافآت</a>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">تخطيط المسار</h2>
        <RoutePlanner />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">ماسح الباركود</h3>
          <BarcodeScanner />
        </div>
        <div>
          <h3 className="font-medium mb-2">مساعد السلامة</h3>
          <SafetyTimer />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-white rounded shadow-sm text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
