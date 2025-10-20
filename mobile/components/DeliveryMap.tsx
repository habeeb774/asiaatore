import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type MapHandle = {
  centerOnDriver: () => void;
  centerOnDestination: () => void;
};

export type DeliveryMapProps = {
  driverLocation?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  active?: boolean;
  onHandle?: (handle: MapHandle) => void;
};

const isWeb = Platform.OS === 'web';

let leafletLib: typeof import('leaflet') | null = null;
let leafletComponents: typeof import('react-leaflet') | null = null;

if (isWeb) {
  leafletLib = require('leaflet') as typeof import('leaflet');
  leafletComponents = require('react-leaflet') as typeof import('react-leaflet');
  require('leaflet/dist/leaflet.css');
  if (leafletLib) {
    const iconRetina = require('leaflet/dist/images/marker-icon-2x.png');
    const icon = require('leaflet/dist/images/marker-icon.png');
    const shadow = require('leaflet/dist/images/marker-shadow.png');
    const iconRetinaUrl = iconRetina?.default ?? iconRetina;
    const iconUrl = icon?.default ?? icon;
    const shadowUrl = shadow?.default ?? shadow;
    // Fix default icon paths for Vite/Webpack bundlers
    leafletLib.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
  }
}

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

export function DeliveryMap({ driverLocation, destination, active, onHandle }: DeliveryMapProps) {
  if (!isWeb || !leafletLib || !leafletComponents) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>الخريطة متاحة عند تشغيل التطبيق على الويب.</Text>
      </View>
    );
  }

  const RL = leafletComponents as typeof import('react-leaflet');
  const { MapContainer, TileLayer, Marker, Polyline, CircleMarker } = RL;
  type LeafletMap = import('leaflet').Map;
  const mapRef = useRef<LeafletMap | null>(null);

  const driverPoint = useMemo(() => {
    if (!driverLocation) return null;
    if (typeof driverLocation.lat !== 'number' || typeof driverLocation.lng !== 'number') return null;
    if (!Number.isFinite(driverLocation.lat) || !Number.isFinite(driverLocation.lng)) return null;
    return [driverLocation.lat, driverLocation.lng] as [number, number];
  }, [driverLocation]);

  const destinationPoint = useMemo(() => {
    if (!destination) return null;
    if (typeof destination.lat !== 'number' || typeof destination.lng !== 'number') return null;
    if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) return null;
    return [destination.lat, destination.lng] as [number, number];
  }, [destination]);

  const initialCenter = useMemo(() => {
    if (destinationPoint) return destinationPoint;
    if (driverPoint) return driverPoint;
    return DEFAULT_CENTER;
  }, [destinationPoint, driverPoint]);

  const handle = useMemo<MapHandle>(() => ({
    centerOnDriver: () => {
      if (driverPoint && mapRef.current) {
        mapRef.current.flyTo(driverPoint, 15, { animate: true, duration: 0.8 });
      }
    },
    centerOnDestination: () => {
      if (destinationPoint && mapRef.current) {
        mapRef.current.flyTo(destinationPoint, 15, { animate: true, duration: 0.8 });
      }
    },
  }), [driverPoint, destinationPoint]);

  useEffect(() => {
    onHandle?.(handle);
  }, [handle, onHandle]);

  useEffect(() => {
    if (active && destinationPoint) {
      handle.centerOnDestination();
    }
  }, [active, destinationPoint, handle]);

  // New: set map ref using react-leaflet hook (avoids using the removed `whenCreated` prop)
  function MapSetter() {
    // useMap is available from react-leaflet runtime import
    const map = (RL as any).useMap() as LeafletMap;
    useEffect(() => {
      if (map) mapRef.current = map;
    }, [map]);
    return null;
  }

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      scrollWheelZoom
      style={styles.map}
    >
      <MapSetter />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {destinationPoint ? (
        <Marker position={destinationPoint} />
      ) : null}
      {driverPoint ? (
        <>
          <Marker position={driverPoint} />
          <CircleMarker center={driverPoint} radius={12} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.2 }} />
        </>
      ) : null}
      {driverPoint && destinationPoint ? (
        <Polyline positions={[driverPoint, destinationPoint]} pathOptions={{ color: '#0ea5e9', weight: 4, dashArray: '6 4' }} />
      ) : null}
    </MapContainer>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fallback: {
    height: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(226, 232, 240, 0.4)',
  },
  fallbackText: {
    color: '#475569',
    textAlign: 'center',
  },
});

export default DeliveryMap;
