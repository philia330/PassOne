"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SingleMarkerMapProps = {
  lat: number;
  lng: number;
  nama: string;
};

const COLOR_POP = "#9333ea";

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
        <CircleMarker
          center={[lat, lng]}
          radius={9}
          pathOptions={{ color: COLOR_POP, fillColor: COLOR_POP, fillOpacity: 1 }}
        >
          <Popup>
            <strong>POP:</strong> {nama}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};