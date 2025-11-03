'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issues with Leaflet in Webpack environments
// This ensures that Leaflet's default marker icons are correctly loaded.
if (typeof window !== 'undefined') {
  // Extend the Default Icon interface to include _getIconUrl
  // This is a workaround for a common Leaflet issue with Webpack/TypeScript
  interface DefaultIconOptions extends L.IconOptions {
    _getIconUrl?: string;
  }

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  } as DefaultIconOptions); // Cast to the extended interface

  // The delete operation is still necessary at runtime for some environments
  // but TypeScript will now allow it due to the interface extension.
  (L.Icon.Default.prototype as DefaultIconOptions)._getIconUrl = undefined;
}

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center, markers }: { center: [number, number], markers: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] }); // Add some padding
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, markers, map]);

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
  // onMarkerClick a été retiré car l'utilisateur ne souhaite plus de modification au clic sur la carte
}

export function MapComponent({ markers, center }: MapProps) {
  const defaultCenter: [number, number] = [14.6928, -17.4467]; // Dakar as a fallback

  // Calculate dynamic center if no specific center is provided and there are markers
  const calculatedCenter: [number, number] = (() => {
    if (center) return center;
    if (markers.length > 0) {
      const sumLat = markers.reduce((sum, m) => sum + m.latitude, 0);
      const sumLng = markers.reduce((sum, m) => sum + m.longitude, 0);
      return [sumLat / markers.length, sumLng / markers.length];
    }
    return defaultCenter;
  })();

  // Utiliser un ref pour chaque marqueur afin de contrôler son popup
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  return (
    <MapContainer
      center={calculatedCenter}
      zoom={markers.length > 0 ? 13 : 10} // Adjust initial zoom if markers are present
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      className="z-10" // Ajout de z-index pour s'assurer que les popups s'affichent au-dessus
    >
      <MapUpdater center={calculatedCenter} markers={markers} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={icon}
          ref={el => {
            if (el) markerRefs.current[marker.id] = el;
          }}
          eventHandlers={{
            mouseover: () => {
              markerRefs.current[marker.id]?.openPopup();
            },
            mouseout: () => {
              markerRefs.current[marker.id]?.closePopup();
            },
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