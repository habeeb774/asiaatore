import React, { useEffect, useRef, useState } from 'react';

// RoutePlanner: accepts `stops` prop = [{ id, lat, lng, label }]
// Computes route using OSRM public API and draws route + markers on a Leaflet map.
export default function RoutePlanner({ stops = [] }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let L;
    // ensure leaflet css is present to avoid layout issues
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }

    import('leaflet').then((leaflet) => {
      if (cancelled) return;
      L = leaflet.default || leaflet;
      try {
        // init map once
        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, { scrollWheelZoom: false });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapRef.current);
        }
      } catch (e) {
        console.warn('leaflet init', e);
      }
    }).catch((err) => {
      console.warn('failed to load leaflet', err);
    });

    return () => { cancelled = true; try { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } } catch {} };
  }, []);

  useEffect(() => {
    // when stops change, request a route from OSRM
    let cancelled = false;
    async function computeRoute() {
      try {
        if (!stops || stops.length < 2) {
          // clear layers
          if (layerRef.current && mapRef.current) {
            layerRef.current.remove();
            layerRef.current = null;
          }
          setRouteInfo(null);
          return;
        }
        setLoading(true);
        // build coord string lon,lat;lon,lat
        const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
        // call OSRM route service
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&annotations=duration,distance&overview=full`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;
        if (!json || json.code !== 'Ok' || !json.routes || !json.routes.length) {
          setRouteInfo({ error: 'لا يوجد نتيجة للمسار' });
          return;
        }
        const route = json.routes[0];

        // draw on map
        const L = (await import('leaflet')).default;
        if (!mapRef.current) return;
        if (layerRef.current) { layerRef.current.remove(); layerRef.current = null; }
        const geo = route.geometry;
        const routeLayer = L.geoJSON(geo, { style: { color: '#1d4ed8', weight: 5, opacity: 0.85 } });
        const markers = L.layerGroup();
        stops.forEach((s, i) => {
          const m = L.marker([s.lat, s.lng]);
          m.bindPopup(`<div style="min-width:120px"><strong>${s.label || 'نقطة'}${i+1}</strong></div>`);
          markers.addLayer(m);
        });
        const group = L.featureGroup([routeLayer, markers]);
        routeLayer.addTo(mapRef.current);
        markers.addTo(mapRef.current);
        layerRef.current = group;
        mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40] });

        // compute cumulative durations per waypoint using annotations (if present)
        let legs = [];
        if (route.legs && route.legs.length) {
          let cum = 0;
          for (let i = 0; i < route.legs.length; i++) {
            const leg = route.legs[i];
            cum += Math.round(leg.duration);
            legs.push({ idx: i + 1, duration: Math.round(leg.duration), cum });
          }
        }
        setRouteInfo({ distance: Math.round(route.distance), duration: Math.round(route.duration), legs });
      } catch (e) {
        console.warn('route compute failed', e);
        if (!cancelled) setRouteInfo({ error: 'فشل حساب المسار' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    computeRoute();
    return () => { cancelled = true; };
  }, [stops]);

  return (
    <div className="route-planner">
      <div ref={ref} className="h-64 bg-gray-50 rounded mb-2" />
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">{stops && stops.length ? `${stops.length} نقاط` : 'اختر نقاطاً على لوحة الطلبات لإظهار المسار'}</div>
        <div className="text-sm text-gray-700">
          {loading && 'حساب المسار...'}
          {routeInfo && !routeInfo.error && (
            <span>المدة: {Math.round((routeInfo.duration||0)/60)} د، المسافة: {(routeInfo.distance||0)/1000} كم</span>
          )}
          {routeInfo && routeInfo.error && <span className="text-red-600">{routeInfo.error}</span>}
        </div>
      </div>
      {routeInfo && routeInfo.legs && (
        <ol className="mt-2 text-sm list-decimal list-inside">
          {routeInfo.legs.map((l) => (
            <li key={l.idx}>مرحلة {l.idx}: {Math.round(l.duration/60)} د (إجمالي {Math.round(l.cum/60)} د)</li>
          ))}
        </ol>
      )}
    </div>
  );
}
