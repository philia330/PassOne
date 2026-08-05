"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import type { NetworkPoint } from "@/lib/network-points";
import { createMarkerIcon, TYPE_COLOR, FAB_STATUS_COLORS, CABLE_COLOR } from "@/lib/map-icons";

const TYPE_LABELS: NetworkPoint["type"][] = ["POP", "OLT", "ODP", "FAB"];

const FAB_STATUS_OPTIONS = ["OPEN", "AKTIF"];

type LatLng = [number, number];

type Connection = {
  id: string;
  from: NetworkPoint;
  to: NetworkPoint;
  color: string;
};

// ============================================================
// OSRM: ambil jalur jalan ASLI antara 2 titik (bukan garis lurus).
// Pakai server demo publik OSRM -- gratis, tapi ada rate limit wajar,
// jadi hasil per pasangan titik di-cache di state `routes` biar tidak
// fetch ulang tiap kali filter/toggle diganti.
// ============================================================
async function fetchRoadRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;

    // GeoJSON kasih [lng, lat], Leaflet butuh [lat, lng] -- dibalik dulu
    return coords.map((c: [number, number]) => [c[1], c[0]] as LatLng);
  } catch {
    return null;
  }
}

export default function NetworkMap({ points }: { points: NetworkPoint[] }) {
  const [activeTypes, setActiveTypes] = useState<Set<NetworkPoint["type"]>>(
    new Set(TYPE_LABELS)
  );
  const [fabStatusFilter, setFabStatusFilter] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Cache rute jalan asli per pasangan titik (key: connection id)
  const [routes, setRoutes] = useState<Record<string, LatLng[]>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  function toggleType(type: NetworkPoint["type"]) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (!activeTypes.has(p.type)) return false;

      if (p.type === "FAB" && fabStatusFilter !== "ALL") {
        if (p.info !== fabStatusFilter) return false;
      }

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(query)) return false;
      }

      return true;
    });
  }, [points, activeTypes, fabStatusFilter, searchQuery]);

  // ============================================================
  // Bangun daftar koneksi (kabel) dari titik-titik yang lagi tampil.
  // ODP/OLT pakai parentId (1 induk), FAB pakai parentIds (bisa lebih
  // dari 1 ODP dari riwayat BAA). Kalau induknya lagi di-filter/hidden,
  // kabelnya otomatis ikut hilang (karena parent-nya gak ketemu di map).
  // ============================================================
  const connections = useMemo<Connection[]>(() => {
    const byId = new Map(filteredPoints.map((p) => [p.id, p]));
    const list: Connection[] = [];

    for (const p of filteredPoints) {
      const parentIds = p.parentIds ?? (p.parentId ? [p.parentId] : []);

      for (const parentId of parentIds) {
        const parent = byId.get(parentId);
        if (!parent) continue;

        const colorKey = `${p.type}-${parent.type}`;
        list.push({
          id: `${p.id}__${parent.id}`,
          from: p,
          to: parent,
          color: CABLE_COLOR[colorKey] ?? "#94a3b8",
        });
      }
    }

    return list;
  }, [filteredPoints]);

  // Fetch rute jalan asli buat tiap koneksi baru yang belum pernah di-fetch
  useEffect(() => {
    connections.forEach((conn) => {
      if (fetchedRef.current.has(conn.id)) return;
      fetchedRef.current.add(conn.id);

      fetchRoadRoute([conn.from.lat, conn.from.lng], [conn.to.lat, conn.to.lng]).then(
        (coords) => {
          if (coords) {
            setRoutes((prev) => ({ ...prev, [conn.id]: coords }));
          }
        }
      );
    });
  }, [connections]);

  const center: [number, number] =
    filteredPoints.length > 0
      ? [filteredPoints[0].lat, filteredPoints[0].lng]
      : points.length > 0
      ? [points[0].lat, points[0].lng]
      : [-6.9147, 107.6098];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">

      {/* Search bar */}
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama POP, OLT, ODP, atau pelanggan FAB..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-wrap gap-2">
          {TYPE_LABELS.map((type) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
                }`}
                style={active ? { backgroundColor: TYPE_COLOR[type] } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: active ? "white" : TYPE_COLOR[type] }}
                />
                {type}
              </button>
            );
          })}
        </div>

        {activeTypes.has("FAB") && (
          <select
            value={fabStatusFilter}
            onChange={(e) => setFabStatusFilter(e.target.value)}
            className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">Semua Status FAB</option>
            {FAB_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-slate-400 dark:text-slate-500">
          {filteredPoints.length} dari {points.length} titik
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        style={{ height: 400, width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Kabel penghubung -- tetap DI LUAR cluster, supaya garis rute
            jalan tetap kelihatan utuh walau marker-nya lagi mengumpul
            jadi cluster bulat */}
        {connections.map((conn) => {
          const roadRoute = routes[conn.id];
          const positions: LatLng[] = roadRoute ?? [
            [conn.from.lat, conn.from.lng],
            [conn.to.lat, conn.to.lng],
          ];

          return (
            <Polyline
              key={conn.id}
              positions={positions}
              pathOptions={{
                color: conn.color,
                weight: 3,
                opacity: 0.7,
                dashArray: roadRoute ? undefined : "6 6",
              }}
            />
          );
        })}

        {/* Marker DI DALAM cluster -- ini yang bikin 100 titik FAB yang
            numpuk otomatis dikumpulin jadi 1 lingkaran angka */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
          {filteredPoints.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={createMarkerIcon(p)}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.type}
                {p.info ? ` — ${p.info}` : ""}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <div className="space-y-3 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-4 text-xs">
          {TYPE_LABELS.map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[type] }} />
              {type}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">Status FAB:</span>
          {Object.entries(FAB_STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>

        {/* Legend kabel */}
        <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">Kabel:</span>
          {Object.entries(CABLE_COLOR).map(([kind, color]) => (
            <span key={kind} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-0.5 w-4" style={{ backgroundColor: color }} />
              {kind.replace("-", " → ")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}