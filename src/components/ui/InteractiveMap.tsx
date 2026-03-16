"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPin {
  name: string;
  addr: string;
  lat: number;
  lng: number;
  color: string;
}

function createIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

export default function InteractiveMap({ pins }: { pins: MapPin[] }) {
  const centerLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
  const centerLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden" style={{ height: "450px" }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((pin) => (
            <Marker key={pin.name} position={[pin.lat, pin.lng]} icon={createIcon(pin.color)}>
              <Popup>
                <strong>{pin.name}</strong>
                <br />
                {pin.addr}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {pins.map((pin, i) => (
          <div key={pin.name} className="flex items-center gap-2 text-xs text-text-muted">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: pin.color }}
            />
            <span>
              {i + 1}. {pin.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
