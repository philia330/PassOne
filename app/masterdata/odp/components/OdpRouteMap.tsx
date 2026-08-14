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
// Icon custom per tipe marker dengan efek hover scale
// ======================================================
const ICON_SVG = {
  OLT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><rect x="4" y="8" width="16" height="10" rx="1"/><path d="M9 4v4M15 4v4M9 21h6"/></svg>`,
  ODP: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V6a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l3-1.7"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>`,
};

const createMarkerIcon = (color: string, svg: string, size = 28, isHighlight = false) => {
  const highlightRing = isHighlight ? `box-shadow: 0 0 0 4px ${color}40, 0 2px 8px rgba(0,0,0,0.4);` : '';

  return L.divIcon({
    className: "custom-network-marker",
    html: `
      <div class="marker-wrapper" style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      ">
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
          ${highlightRing}
        ">
          ${svg}
        </div>
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
    <div className="relative isolate w-full h-full">
      <style>{`
        .custom-network-marker .leaflet-marker-icon {
          transition: transform 0.2s ease !important;
        }
        .custom-network-marker:hover .marker-wrapper > div {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .custom-network-marker:hover .marker-wrapper {
          transform: translateY(-2px);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          font-family: inherit;
        }
        .leaflet-popup-close-button {
          color: #64748b !important;
        }
      `}</style>

      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm text-sm text-slate-500 dark:bg-slate-900/80 dark:text-slate-400 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin"></div>
            <span>Menghitung jalur ke semua ODP...</span>
          </div>
        </div>
      )}

      <MapContainer
        key={`odp-route-all-${points.length}`}
        center={[centerLat, centerLng]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        className="w-full z-0 rounded-2xl dark:[&_.leaflet-tile]:invert dark:[&_.leaflet-tile]:hue-rotate-180 dark:[&_.leaflet-tile]:brightness-95 dark:[&_.leaflet-tile]:contrast-90 dark:[&_.leaflet-popup-content-wrapper]:bg-slate-900 dark:[&_.leaflet-popup-content-wrapper]:text-slate-100 dark:[&_.leaflet-popup-tip]:bg-slate-900"
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
              <div className="text-sm">
                <strong className="text-sky-600 dark:text-sky-400">OLT</strong>
                <br />
                <span className="text-slate-700 dark:text-slate-200">{olt.nama}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marker semua ODP */}
        {points.map((p) => {
          const isHighlight = p.id_odp === highlightId;
          return (
            <Marker
              key={`odp-${p.id_odp}`}
              position={[p.odpLat, p.odpLng]}
              icon={createMarkerIcon(
                isHighlight ? COLOR_ODP_HIGHLIGHT : COLOR_ODP,
                ICON_SVG.ODP,
                isHighlight ? 34 : 28,
                isHighlight
              )}
            >
              <Popup>
                <div className="text-sm">
                  <strong className={isHighlight ? "text-red-500" : "text-amber-600"}>
                    ODP
                  </strong>
                  <br />
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{p.odpNama}</span>
                  <br />
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    OLT: {p.oltNama}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};