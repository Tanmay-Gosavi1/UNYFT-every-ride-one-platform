import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map center / fit bounds hook
function MapController({ pickup, dropoff, driverLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !dropoff) return;
    const points = [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ];
    if (driverLocation) {
      points.push([driverLocation.lat, driverLocation.lng]);
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, pickup, dropoff, driverLocation]);

  return null;
}

// Custom DivIcon generators
const createPickupIcon = () =>
  L.divIcon({
    className: 'custom-pickup-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 18px; height: 18px; border-radius: 9999px; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 0 15px #10b981;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createDropoffIcon = () =>
  L.divIcon({
    className: 'custom-dropoff-marker',
    html: `
      <div style="width: 18px; height: 18px; border-radius: 9999px; background: #f43f5e; border: 3px solid #ffffff; box-shadow: 0 0 15px #f43f5e;"></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const createDriverIcon = (bearing = 0) =>
  L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="transform: rotate(${bearing}deg); width: 34px; height: 34px; border-radius: 12px; background: #0f172a; border: 2px solid #10b981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

export default function LiveRadarMap({ pickup, dropoff, driverLocation }) {
  const defaultCenter = pickup ? [pickup.lat, pickup.lng] : [12.9716, 77.5946];

  // Route Polyline coordinates
  const polylinePositions = [];
  if (pickup) polylinePositions.push([pickup.lat, pickup.lng]);
  if (driverLocation) polylinePositions.push([driverLocation.lat, driverLocation.lng]);
  if (dropoff) polylinePositions.push([dropoff.lat, dropoff.lng]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        {/* OpenStreetMap Dark styled tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={createPickupIcon()}>
            <Popup className="dark-popup">
              <strong className="text-emerald-400">Pickup:</strong> {pickup.address}
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={createDropoffIcon()}>
            <Popup className="dark-popup">
              <strong className="text-rose-400">Dropoff:</strong> {dropoff.address}
            </Popup>
          </Marker>
        )}

        {/* Driver live radar marker */}
        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={createDriverIcon(driverLocation.bearing || 0)}
          >
            <Popup className="dark-popup">
              <strong className="text-emerald-400">Driver Location</strong>
              <br />
              Speed: {driverLocation.speed || 24} km/h
            </Popup>
          </Marker>
        )}

        {/* Polyline route path */}
        {polylinePositions.length >= 2 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />
        )}

        <MapController pickup={pickup} dropoff={dropoff} driverLocation={driverLocation} />
      </MapContainer>

      {/* Floating Radar Telemetry HUD badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none glass-panel px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>RADAR TELEMETRY LIVE</span>
      </div>
    </div>
  );
}
