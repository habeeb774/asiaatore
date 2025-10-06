// Distance-based shipping utilities
// - Uses Haversine formula
// - Matches destination by city name (simple normalization + synonyms)

const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

// Basic KSA city coordinates (approx.)
const CITY_COORDS = [
  { key: 'riyadh', names: ['riyadh','riy','رياض'], lat: 24.7136, lng: 46.6753 },
  { key: 'jeddah', names: ['jeddah','jed','جدة','makkah al-mukarramah province'], lat: 21.4858, lng: 39.1925 },
  { key: 'dammam', names: ['dammam','dam','الدمام','دمام'], lat: 26.4207, lng: 50.0888 },
  { key: 'khobar', names: ['khobar','al khobar','خبر','الخبر'], lat: 26.2794, lng: 50.2083 },
  { key: 'makkah', names: ['makkah','mecca','مكة'], lat: 21.3891, lng: 39.8579 },
  { key: 'madinah', names: ['madinah','medina','المدينة','المدينة المنورة'], lat: 24.5247, lng: 39.5692 },
  { key: 'abha', names: ['abha','ابها'], lat: 18.2465, lng: 42.5117 },
  { key: 'jizan', names: ['jizan','جيزان','gizan','جازان','jiz'], lat: 16.8892, lng: 42.5700 },
  { key: 'hail', names: ['hail','حايل','حائل'], lat: 27.5114, lng: 41.7208 },
  { key: 'qassim', names: ['qassim','القصيم','buraydah','بريدة'], lat: 26.3594, lng: 43.9790 },
  { key: 'tabuk', names: ['tabuk','تبوك'], lat: 28.3833, lng: 36.5667 },
  { key: 'taif', names: ['taif','الطائف'], lat: 21.4373, lng: 40.5127 },
  { key: 'ahsa', names: ['ahsa','al ahsa','الاحساء','الأحساء','al-hasa'], lat: 25.3833, lng: 49.6000 }
];

export function findCityCoords(cityRaw) {
  if (!cityRaw) return null;
  const c = String(cityRaw).toLowerCase().trim();
  // Remove diacritics / normalize common forms
  const normalized = c
    .replace(/[\u064B-\u0652]/g, '') // Arabic diacritics
    .replace(/\s+/g, ' ');
  for (const entry of CITY_COORDS) {
    if (entry.names.some(n => normalized.includes(n))) {
      return { lat: entry.lat, lng: entry.lng, key: entry.key, label: entry.names[0] };
    }
  }
  return null;
}

export function getOrigin() {
  const lat = Number(process.env.STORE_ORIGIN_LAT || 24.7136); // default Riyadh
  const lng = Number(process.env.STORE_ORIGIN_LNG || 46.6753);
  return { lat, lng };
}

export function computeShippingFee(distanceKm) {
  // Configurable via env
  const base = Number(process.env.SHIPPING_BASE || 10); // SAR
  const perKm = Number(process.env.SHIPPING_PER_KM || 0.7); // SAR per km
  const minFee = Number(process.env.SHIPPING_MIN || 15);
  const maxFee = Number(process.env.SHIPPING_MAX || 60);
  const fee = Math.max(minFee, Math.min(maxFee, +(base + distanceKm * perKm).toFixed(2)));
  return fee;
}

export function quoteShipping(address) {
  const origin = getOrigin();
  const cityCoords = findCityCoords(address?.city || '');
  if (!cityCoords) {
    // Unknown city: fall back to default flat rate
    const fallback = Number(process.env.SHIPPING_FALLBACK || 25);
    return { method: 'fallback', shipping: fallback, distanceKm: null, cityMatched: null };
  }
  const distanceKm = haversineKm(origin, cityCoords);
  const shipping = computeShippingFee(distanceKm);
  return { method: 'distance', shipping, distanceKm: +distanceKm.toFixed(1), cityMatched: cityCoords.key };
}

export default { haversineKm, findCityCoords, getOrigin, computeShippingFee, quoteShipping };
