import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Button from '../../components/ui/Button.jsx';

export default function DeliveryAvailability() {
  const { user } = useAuth() || {};
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await api.request('/delivery/me/profile');
      setProfile(res.profile || { online: false });
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (user && (user.role === 'delivery' || user.role === 'admin')) load(); }, [user]);

  const update = async (patch) => {
    setSaving(true); setError(null);
    try {
      const res = await api.request('/delivery/me/profile', { method: 'PATCH', body: JSON.stringify(patch) });
      setProfile(res.profile);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!(user.role === 'delivery' || user.role === 'admin')) return <div className="container mx-auto p-4">غير مصرح</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">التوافر</h1>
      {error && <div className="text-red-600 text-sm mb-2">{String(error)}</div>}
      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" checked={!!profile?.online} onChange={e => update({ online: e.target.checked })} disabled={saving} />
          <span>متاح لاستلام الطلبات</span>
        </label>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border rounded px-3 py-2 bg-white" placeholder="نوع المركبة" value={profile?.vehicleType || ''} onChange={e => setProfile(p => ({ ...(p||{}), vehicleType: e.target.value }))} />
          <input className="border rounded px-3 py-2 bg-white" placeholder="رقم اللوحة" value={profile?.licensePlate || ''} onChange={e => setProfile(p => ({ ...(p||{}), licensePlate: e.target.value }))} />
        </div>
        <div className="mt-3">
          <Button variant="success" onClick={() => update({ vehicleType: profile?.vehicleType || null, licensePlate: profile?.licensePlate || null })} disabled={saving}>حفظ</Button>
        </div>
      </div>
    </div>
  );
}
