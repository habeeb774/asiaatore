import React from 'react';

// Runtime wrapper that lazy-loads leaflet + react-leaflet only when a map is rendered.
// Children is a function that receives the loaded components: { MapContainer, TileLayer, Marker, Polyline, useMap, ... }

let loaded = null;

async function loadLeaflet() {
  if (loaded) return loaded;
  // Import CSS dynamically
  try {
    const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = cssHref;
      document.head.appendChild(l);
    }
  } catch (e) { /* ignore */ }

  const [L, RL] = await Promise.all([
    import('leaflet'),
    import('react-leaflet')
  ]);

  // Fix default icon URLs if needed
  try {
    if (L && L.Icon && L.Icon.Default && typeof L.Icon.Default.mergeOptions === 'function') {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  } catch (e) { /* ignore */ }

  loaded = {
    L,
    ...RL
  };
  return loaded;
}

export default function ReactLeafletCompat({ children }) {
  const [mods, setMods] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    loadLeaflet().then(m => { if (mounted) setMods(m); }).catch(() => { if (mounted) setMods(null); });
    return () => { mounted = false; };
  }, []);

  if (!mods) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 text-sm text-gray-500">تحميل الخريطة...</div>
    );
  }

  // Prepare convenient aliases for components and some helpers
  const components = {
    MapContainer: mods.MapContainer,
    TileLayer: mods.TileLayer,
    Marker: mods.Marker,
    Polyline: mods.Polyline,
    useMap: mods.useMap,
    // Provide a small MapClicker wrapper if not present
    MapClicker: (props) => {
      const map = mods.useMap();
      React.useEffect(() => {
        if (!map || typeof map.on !== 'function') return;
        const handler = (e) => { try { props?.onPick && props.onPick({ lat: e?.latlng?.lat, lng: e?.latlng?.lng }); } catch {} };
        try { map.on('click', handler); } catch {}
        return () => { try { map && typeof map.off === 'function' && map.off('click', handler); } catch {} };
      }, [map, props?.onPick]);
      return null;
    }
  };

  return children(components);
}
