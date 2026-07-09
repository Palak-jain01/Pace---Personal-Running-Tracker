import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  route: string | null;
  className?: string;
}

export function RouteMap({ route, className = "h-64 w-full" }: RouteMapProps) {
  const [positions, setPositions] = useState<[number, number][]>([]);

  useEffect(() => {
    if (route) {
      try {
        const parsed = JSON.parse(route);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPositions(parsed);
        }
      } catch (e) {
        console.error("Failed to parse route", e);
      }
    }
  }, [route]);

  if (!route || positions.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center rounded-xl overflow-hidden ${className}`}>
        <p className="text-gray-400 font-medium">No route data</p>
      </div>
    );
  }

  // Calculate bounds to fit the polyline
  const lats = positions.map(p => p[0]);
  const lngs = positions.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const bounds: [[number, number], [number, number]] = [[minLat, minLng], [maxLat, maxLng]];

  return (
    <div className={`rounded-xl overflow-hidden relative z-0 ${className}`}>
      <MapContainer 
        bounds={bounds} 
        scrollWheelZoom={false}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Polyline positions={positions} pathOptions={{ color: '#CCFF00', weight: 4, opacity: 0.8 }} />
      </MapContainer>
    </div>
  );
}
