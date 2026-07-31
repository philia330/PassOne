"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type SingleMarkerMapProps = {
  lat: number;
  lng: number;
  nama: string;
};

const COLOR_POP = "#2327ff";

const POP_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v6M12 13l-5 4M12 13l5 4"/></svg>`;

const createPopIcon = () => {
  return L.divIcon({
    className: "custom-network-marker",
    html: `
      <div style="
        background-color: ${COLOR_POP};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      ">
        ${POP_ICON_SVG}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const SingleMarkerMap = ({ lat, lng, nama }: SingleMarkerMapProps) => {
  return (
    <div className="relative isolate w-full overflow-hidden rounded-2xl border">
      <MapContainer
        key={`pop-map-${lat}-${lng}`}
        center={[lat, lng]}
        zoom={15}
        style={{ height: "300px", width: "100%" }}
        className="w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[lat, lng]} icon={createPopIcon()}>
          <Popup>
            <strong>POP:</strong> {nama}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};