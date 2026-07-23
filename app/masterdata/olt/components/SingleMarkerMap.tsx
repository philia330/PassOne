"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SingleMarkerMapProps = {
  lat: number;
  lng: number;
  nama: string;
};

const COLOR_OLT = "#0284c7";

export const SingleMarkerMap = ({ lat, lng, nama }: SingleMarkerMapProps) => {
  return (
    <div className="relative isolate w-full overflow-hidden rounded-2xl border">
      <MapContainer
        key={`olt-map-${lat}-${lng}`}
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
          pathOptions={{ color: COLOR_OLT, fillColor: COLOR_OLT, fillOpacity: 1 }}
        >
          <Popup>
            <strong>OLT:</strong> {nama}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};