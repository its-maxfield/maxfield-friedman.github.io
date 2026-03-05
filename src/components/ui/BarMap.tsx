"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Bar {
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

export default function BarMap({ bars }: { bars: Bar[] }) {
  const centerLat = bars.reduce((s, b) => s + b.lat, 0) / bars.length;
  const centerLng = bars.reduce((s, b) => s + b.lng, 0) / bars.length;

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
          {bars.map((bar) => (
            <Marker key={bar.name} position={[bar.lat, bar.lng]} icon={createIcon(bar.color)}>
              <Popup>
                <strong>{bar.name}</strong>
                <br />
                {bar.addr}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {bars.map((bar, i) => (
          <div key={bar.name} className="flex items-center gap-2 text-xs text-text-muted">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: bar.color }}
            />
            <span>
              {i + 1}. {bar.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
