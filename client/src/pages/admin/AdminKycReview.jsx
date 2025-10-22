import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';

export default function AdminKycReview() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.listUsers({ status });
      setItems(res.items || res.users || []);
    } catch (e) {
      setError(e.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); }, [status]);
  const approve = async (id) => {
    try {
      await adminApi.activateUser(id);
      await load();
    } catch (e) {
      setError(e.data?.error || e.message);
    }
  };
  const reject = async (id) => {
    // No direct reject API, so we use deactivateUser as a placeholder
    const reason = prompt('سبب الرفض؟') || '';
    try {
      await adminApi.deactivateUser(id);
      await load();
    } catch (e) {
      setError(e.data?.error || e.message);
    }
  };
  return (
    <div className="container-custom p-4">
      <h2 className="text-xl font-bold mb-4">مراجعة KYC للبائعين</h2>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <label>الحالة:</label>
        <select className="border px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="none">None</option>
        </select>
        <button className="btn-secondary btn-xs" onClick={load}>تحديث</button>
      </div>
      {error && <div className="text-sm text-red-600 mb-2">خطأ: {String(error)}</div>}
      {loading ? (
        <div>تحميل...</div>
      ) : (
        <ul className="space-y-3">
          {items.map(s => (
            <li key={s.id} className="border rounded p-3 text-sm">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{s.storeName} — {s.user?.email || s.userId}</div>
                <div className="flex gap-2">
                  <button className="btn-primary btn-xs" onClick={()=>approve(s.id)}>موافقة</button>
                  <button className="btn-danger btn-xs" onClick={()=>reject(s.id)}>رفض</button>
                </div>
              </div>
              <div>Company: {s.companyName || '—'} | CR: {s.crNumber || '—'}</div>
              <div>IBAN: {s.iban || '—'} | Bank: {s.bankName || '—'}</div>
              <div>Address: {s.addressText || '—'}</div>
              <div>Status: <strong>{s.kycStatus || 'none'}</strong></div>
            </li>
          ))}
          {items.length === 0 && <li className="text-gray-500">لا يوجد عناصر</li>}
        </ul>
      )}
    </div>
  );
}
