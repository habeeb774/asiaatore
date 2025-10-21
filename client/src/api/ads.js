// client/src/api/ads.js
import api from './client';

export async function listAds() {
  // يجلب الإعلانات من جدول Ad مباشرة
  const res = await api.listAds();
  return res?.filter(b => b.status) || [];
}
