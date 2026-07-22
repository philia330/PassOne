"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type OdpRouteMapProps = {
  odpLat: number;
  odpLng: number;
  odpNama: string;
  oltLat: number;
  oltLng: number;
  oltNama: string;
};

const COLOR_ODP = "#16a34a";
const COLOR_OLT = "#0284c7";
const COLOR_JALUR = "#eab308"; // kuning

export const OdpRouteMap = ({
  odpLat,
  odpLng,
  odpNama,
  oltLat,
  oltLng,
  oltNama,
}: OdpRouteMapProps) => {
  const centerLat = (odpLat + oltLat) / 2;
  const centerLng = (odpLng + oltLng) / 2;

  return (
    <div className="relative isolate w-full overflow-hidden rounded-2xl border">
      <MapContainer
        key={`odp-route-${odpLat}-${odpLng}-${oltLat}-${oltLng}`}
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ height: "300px", width: "100%" }}
        className="w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Polyline
          positions={[
            [oltLat, oltLng],
            [odpLat, odpLng],
          ]}
          pathOptions={{ color: COLOR_JALUR, weight: 4, dashArray: "6 6" }}
        />

        <CircleMarker
          center={[oltLat, oltLng]}
          radius={9}
          pathOptions={{ color: COLOR_OLT, fillColor: COLOR_OLT, fillOpacity: 1 }}
        >
          <Popup>
            <strong>OLT:</strong> {oltNama}
          </Popup>
        </CircleMarker>

        <CircleMarker
          center={[odpLat, odpLng]}
          radius={9}
          pathOptions={{ color: COLOR_ODP, fillColor: COLOR_ODP, fillOpacity: 1 }}
        >
          <Popup>
            <strong>ODP:</strong> {odpNama}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};