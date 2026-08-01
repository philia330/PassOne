"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type OdpPoint = {
  id_odp: number;
  odpNama: string;
  odpLat: number;
  odpLng: number;
  oltNama: string;
  oltLat: number;
  oltLng: number;
};

type OdpRouteMapProps = {
  points: OdpPoint[];
  highlightId?: number;
};

const COLOR_ODP = "#f59e0b";
const COLOR_ODP_HIGHLIGHT = "#dc2626";
const COLOR_OLT = "#0ea5e9";
const COLOR_JALUR = "#eab308";

// ======================================================
// Icon custom per tipe marker
// ======================================================
const ICON_SVG = {
  OLT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><rect x="4" y="8" width="16" height="10" rx="1"/><path d="M9 4v4M15 4v4M9 21h6"/></svg>`,
  ODP: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V6a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l3-1.7"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>`,
};

const createMarkerIcon = (color: string, svg: string, size = 28) => {
  return L.divIcon({
    className: "custom-network-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      ">
        ${svg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Ambil rute mengikuti jalan lewat OSRM (public demo server, gratis)
const fetchRoute = async (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<[number, number][] | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as
      | [number, number][]
      | undefined;
    if (!coords) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
};

export const OdpRouteMap = ({ points, highlightId }: OdpRouteMapProps) => {
  const [routes, setRoutes] = useState<Record<number, [number, number][]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoutes = async () => {
      setLoading(true);
      const result: Record<number, [number, number][]> = {};

      for (const p of points) {
        const route = await fetchRoute(p.oltLat, p.oltLng, p.odpLat, p.odpLng);
        if (route) {
          result[p.id_odp] = route;
        }
        if (cancelled) return;
      }

      if (!cancelled) {
        setRoutes(result);
        setLoading(false);
      }
    };

    loadRoutes();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p.id_odp).join(",")]);

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Tidak ada data ODP untuk ditampilkan.
      </div>
    );
  }

  // Hitung titik tengah dari semua titik (ODP + OLT)
  const allLats = points.flatMap((p) => [p.odpLat, p.oltLat]);
  const allLngs = points.flatMap((p) => [p.odpLng, p.oltLng]);
  const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
  const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

  // OLT unik (biar tidak dobel marker kalau beberapa ODP satu OLT)
  const uniqueOlts = Array.from(
    new Map(
      points.map((p) => [`${p.oltLat},${p.oltLng}`, { lat: p.oltLat, lng: p.oltLng, nama: p.oltNama }])
    ).values()
  );

  return (
    <div className="relative isolate w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 text-sm text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
          Menghitung jalur ke semua ODP...
        </div>
      )}

      <MapContainer
        key={`odp-route-all-${points.length}`}
        center={[centerLat, centerLng]}
        zoom={11}
        style={{ height: "450px", width: "100%" }}
        className="w-full z-0 dark:[&_.leaflet-tile]:invert dark:[&_.leaflet-tile]:hue-rotate-180 dark:[&_.leaflet-tile]:brightness-95 dark:[&_.leaflet-tile]:contrast-90 dark:[&_.leaflet-popup-content-wrapper]:bg-slate-900 dark:[&_.leaflet-popup-content-wrapper]:text-slate-100 dark:[&_.leaflet-popup-tip]:bg-slate-900"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Jalur untuk setiap ODP */}
        {points.map((p) => (
          <Polyline
            key={`route-${p.id_odp}`}
            positions={
              routes[p.id_odp] ?? [
                [p.oltLat, p.oltLng],
                [p.odpLat, p.odpLng],
              ]
            }
            pathOptions={{
              color: COLOR_JALUR,
              weight: 3,
              dashArray: routes[p.id_odp] ? undefined : "6 6",
              opacity: routes[p.id_odp] ? 1 : 0.5,
            }}
          />
        ))}

        {/* Marker OLT (unik) */}
        {uniqueOlts.map((olt, i) => (
          <Marker
            key={`olt-${i}`}
            position={[olt.lat, olt.lng]}
            icon={createMarkerIcon(COLOR_OLT, ICON_SVG.OLT)}
          >
            <Popup>
              <strong>OLT:</strong> {olt.nama}
            </Popup>
          </Marker>
        ))}

        {/* Marker semua ODP */}
        {points.map((p) => (
          <Marker
            key={`odp-${p.id_odp}`}
            position={[p.odpLat, p.odpLng]}
            icon={createMarkerIcon(
              p.id_odp === highlightId ? COLOR_ODP_HIGHLIGHT : COLOR_ODP,
              ICON_SVG.ODP,
              p.id_odp === highlightId ? 34 : 28
            )}
          >
            <Popup>
              <strong>ODP:</strong> {p.odpNama}
              <br />
              OLT: {p.oltNama}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};