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
    <div className="relative isolate w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <MapContainer
        key={`olt-map-${lat}-${lng}`}
        center={[lat, lng]}
        zoom={15}
        style={{ height: "300px", width: "100%" }}
        className="w-full z-0 dark:[&_.leaflet-tile]:invert dark:[&_.leaflet-tile]:hue-rotate-180 dark:[&_.leaflet-tile]:brightness-95 dark:[&_.leaflet-tile]:contrast-90 dark:[&_.leaflet-popup-content-wrapper]:bg-slate-900 dark:[&_.leaflet-popup-content-wrapper]:text-slate-100 dark:[&_.leaflet-popup-tip]:bg-slate-900"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={9}
          pathOptions={{ color: COLOR_OLT, fillColor: COLOR_OLT, fillOpacity: 1 }}
        >
          <Popup>
            <div className="p-1">
              <strong className="text-sky-600 dark:text-sky-400">OLT:</strong>{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {nama}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};