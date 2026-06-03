import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'motion/react';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), {
      animate: true,
      duration: 1.5,
    });
  }, [center, map]);
  return null;
}

interface MapSectionProps {
  lat: number;
  lon: number;
  city: string;
}

export default function MapSection({ lat, lon, city }: MapSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-panel"
      style={{
        padding: 20,
        borderRadius: '1.5rem',
        marginTop: 24,
        overflow: 'hidden',
        height: '300px',
        position: 'relative'
      }}
    >
      <h3 style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        Interactive Map
      </h3>
      <div style={{ borderRadius: '1rem', overflow: 'hidden', height: 'calc(100% - 32px)' }}>
        <MapContainer center={[lat, lon]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]} />
          <MapUpdater center={[lat, lon]} />
        </MapContainer>
      </div>
    </motion.div>
  );
}
