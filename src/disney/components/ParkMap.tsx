"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Attraction, PriorityTier } from "../types";

type MarkerData = {
  attraction: Attraction;
  tier?: PriorityTier;
  wait?: number;
  unavailable?: boolean;
  completed?: boolean;
};

const colors: Record<PriorityTier, string> = {
  must: "#fcd34d",
  nice: "#7dd3fc",
  convenient: "#6ee7b7",
  "dont-care": "#9ca3af",
};

function markerIcon(marker: MarkerData) {
  const background = marker.unavailable ? "#fb7185" : marker.completed ? "#475569" : colors[marker.tier ?? "dont-care"];
  const label = marker.completed ? "✓" : marker.wait ?? "·";
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px;border:3px solid #07110f;background:${background};color:#07110f;font:900 10px system-ui;box-shadow:0 3px 10px rgba(0,0,0,.45)">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function ParkMap({ markers, onSelect }: { markers: MarkerData[]; onSelect: (id: string) => void }) {
  const center: [number, number] = markers.length
    ? [markers.reduce((sum, item) => sum + item.attraction.latitude, 0) / markers.length, markers.reduce((sum, item) => sum + item.attraction.longitude, 0) / markers.length]
    : [33.8119, -117.919];

  return <MapContainer center={center} zoom={16} minZoom={15} maxZoom={19} scrollWheelZoom={false} maxBounds={[[33.798, -117.931], [33.821, -117.906]]} style={{ height: "58dvh", minHeight: 480, width: "100%", background: "#10221d" }}>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" updateWhenIdle keepBuffer={2} />
    {markers.map((marker) => <Marker key={marker.attraction.id} position={[marker.attraction.latitude, marker.attraction.longitude]} icon={markerIcon(marker)} eventHandlers={{ click: () => onSelect(marker.attraction.id) }}>
      <Tooltip direction="top" offset={[0, -14]}>{marker.attraction.name}{marker.wait !== undefined ? ` · ${marker.wait}m` : ""}</Tooltip>
    </Marker>)}
  </MapContainer>;
}
