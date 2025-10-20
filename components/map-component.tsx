'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

interface MapProps {
  markers: Array<{
    id: string;
    nom: string;
    latitude: number;
    longitude: number;
    nombre_de_plants: number;
    taux_de_survie: number;
  }>;
  center?: [number, number];
  onMarkerClick?: (id: string) => void;
}

export function MapComponent({ markers, center, onMarkerClick }: MapProps) {
  const defaultCenter: [number, number] = center || [14.6928, -17.4467];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    >
      <MapUpdater center={center || defaultCenter} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => onMarkerClick?.(marker.id),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">{marker.nom}</h3>
              <p className="text-sm">
                <strong>Plants:</strong> {marker.nombre_de_plants}
              </p>
              <p className="text-sm">
                <strong>Taux de survie:</strong> {marker.taux_de_survie}%
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
