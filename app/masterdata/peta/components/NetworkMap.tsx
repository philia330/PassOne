"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type PopPoint = { id: number; nama: string; lat: number; lng: number };
type OltPoint = { id: number; nama: string; lat: number; lng: number; id_pop: number };
type OdpPoint = { id: number; nama: string; lat: number; lng: number; id_olt: number };

export type NetworkMapProps = {
  pops: PopPoint[];
  olts: OltPoint[];
  odps: OdpPoint[];
};

const COLOR_POP = "#9333ea";
const COLOR_OLT = "#0ea5e9";
const COLOR_ODP = "#f97316";

export const NetworkMap = ({ pops, olts, odps }: NetworkMapProps) => {
  const allPoints = [...pops, ...olts, ...odps];

  const center: [number, number] = allPoints.length
    ? [
        allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length,
        allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length,
      ]
    : [-6.9175, 107.6191];

  const popById = new Map(pops.map((p) => [p.id, p]));
  const oltById = new Map(olts.map((o) => [o.id, o]));

  return (  
    <div className="relative isolate rounded-3xl overflow-hidden border shadow-xl">
      <MapContainer
        key="network-map"
        center={center}
        zoom={13}
        style={{ height: "380px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {olts.map((olt) => {
          const pop = popById.get(olt.id_pop);
          if (!pop) return null;
          return (
            <Polyline
              key={`pop-olt-${olt.id}`}
              positions={[[pop.lat, pop.lng], [olt.lat, olt.lng]]}
              pathOptions={{ color: COLOR_POP, weight: 3 }}
            />
          );
        })}

        {odps.map((odp) => {
          const olt = oltById.get(odp.id_olt);
          if (!olt) return null;
          return (
            <Polyline
              key={`olt-odp-${odp.id}`}
              positions={[[olt.lat, olt.lng], [odp.lat, odp.lng]]}
              pathOptions={{ color: COLOR_OLT, weight: 2 }}
            />
          );
        })}

        {pops.map((pop) => (
          <CircleMarker
            key={`pop-${pop.id}`}
            center={[pop.lat, pop.lng]}
            radius={8}
            pathOptions={{ color: COLOR_POP, fillColor: COLOR_POP, fillOpacity: 1 }}
          >
            <Popup>
              <strong>POP:</strong> {pop.nama}
            </Popup>
          </CircleMarker>
        ))}

        {olts.map((olt) => (
          <CircleMarker
            key={`olt-${olt.id}`}
            center={[olt.lat, olt.lng]}
            radius={7}
            pathOptions={{ color: COLOR_OLT, fillColor: COLOR_OLT, fillOpacity: 1 }}
          >
            <Popup>
              <strong>OLT:</strong> {olt.nama}
            </Popup>
          </CircleMarker>
        ))}

        {odps.map((odp) => (
          <CircleMarker
            key={`odp-${odp.id}`}
            center={[odp.lat, odp.lng]}
            radius={6}
            pathOptions={{ color: COLOR_ODP, fillColor: COLOR_ODP, fillOpacity: 1 }}
          >
            <Popup>
              <strong>ODP:</strong> {odp.nama}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="flex items-center gap-4 p-3 bg-white border-t text-sm">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: COLOR_POP }}
          />
          POP
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: COLOR_OLT }}
          />
          OLT
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: COLOR_ODP }}
          />
          ODP
        </span>
      </div>
    </div>
  );
};