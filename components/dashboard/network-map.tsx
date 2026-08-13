"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import PointDetailDrawer from "@/components/dashboard/PointDetailDrawer";

import type { NetworkPoint } from "@/lib/network-points";
import { createMarkerIcon, TYPE_COLOR, FAB_STATUS_COLORS, CABLE_COLOR } from "@/lib/map-icons";

function MapAutoPan({ searchQuery, filteredPoints }: { searchQuery: string; filteredPoints: NetworkPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (searchQuery.trim().length > 0 && filteredPoints.length > 0) {
      const first = filteredPoints[0];
      if (!Number.isFinite(first.lat) || !Number.isFinite(first.lng)) return;
      map.flyTo([first.lat, first.lng], 16, { animate: true, duration: 0.5 });
    }
  }, [searchQuery, filteredPoints, map]);

  return null;
}

const TYPE_LABELS: NetworkPoint["type"][] = ["POP", "OLT", "ODP", "FAB"];
const FAB_STATUS_OPTIONS = ["OPEN", "AKTIF"];
type LatLng = [number, number];

type Connection = {
  id: string;
  from: NetworkPoint;
  to: NetworkPoint;
  color: string;
};

async function fetchRoadRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;
    return coords.map((c: [number, number]) => [c[1], c[0]] as LatLng);
  } catch {
    return null;
  }
}

export default function NetworkMap({ points, fullHeight = false }: { points: NetworkPoint[]; fullHeight?: boolean }) {
  const [activeTypes, setActiveTypes] = useState<Set<NetworkPoint["type"]>>(new Set(TYPE_LABELS));
  const [fabStatusFilter, setFabStatusFilter] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapKey] = useState(() => `map-${Math.random().toString(36).slice(2)}`);
  const [selectedPoint, setSelectedPoint] = useState<NetworkPoint | null>(null);
  const [routes, setRoutes] = useState<Record<string, LatLng[]>>({});
  const fetchedRef = useRef<Set<string>>(new Set());
  const mapIdRef = useRef(`leaflet-map-${Math.random().toString(36).slice(2)}`);

  function toggleType(type: NetworkPoint["type"]) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
      if (!activeTypes.has(p.type)) return false;
      if (p.type === "FAB" && fabStatusFilter !== "ALL" && p.info !== fabStatusFilter) return false;
      if (searchQuery.trim().length > 0 && !p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      return true;
    });
  }, [points, activeTypes, fabStatusFilter, searchQuery]);

  const connections = useMemo<Connection[]>(() => {
    const byId = new Map(filteredPoints.map((p) => [p.id, p]));
    const list: Connection[] = [];
    for (const p of filteredPoints) {
      const parentIds = p.parentIds ?? (p.parentId ? [p.parentId] : []);
      for (const parentId of parentIds) {
        const parent = byId.get(parentId);
        if (!parent) continue;
        const colorKey = `${p.type}-${parent.type}`;
        list.push({ id: `${p.id}__${parent.id}`, from: p, to: parent, color: CABLE_COLOR[colorKey] ?? "#94a3b8" });
      }
    }
    return list;
  }, [filteredPoints]);

  useEffect(() => {
    connections.forEach((conn) => {
      if (fetchedRef.current.has(conn.id)) return;
      fetchedRef.current.add(conn.id);
      fetchRoadRoute([conn.from.lat, conn.from.lng], [conn.to.lat, conn.to.lng]).then((coords) => {
        if (coords) setRoutes((prev) => ({ ...prev, [conn.id]: coords }));
      });
    });
  }, [connections]);

  const center: [number, number] = filteredPoints.length > 0
    ? [filteredPoints[0].lat, filteredPoints[0].lng]
    : points.length > 0
    ? [points[0].lat, points[0].lng]
    : [-6.9147, 107.6098];

  return (
    <div className={`relative flex flex-col bg-white dark:bg-slate-900 ${fullHeight ? "h-full" : "rounded-2xl border border-slate-200 dark:border-slate-800"}`}>
      {/* Search bar */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama POP, OLT, ODP, atau pelanggan FAB..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex flex-wrap gap-2">
          {TYPE_LABELS.map((type) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-transparent text-white" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"}`}
                style={active ? { backgroundColor: TYPE_COLOR[type] } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "white" : TYPE_COLOR[type] }} />
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
            {FAB_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500">{filteredPoints.length} dari {points.length} titik</span>
      </div>

      {/* Map Container */}
      <div className="relative flex-1" style={{ minHeight: fullHeight ? "calc(100vh - 8rem)" : "400px" }}>
        <MapContainer
          key={mapKey}
          id={mapIdRef.current}
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
          scrollWheelZoom={true}
        >
          <MapAutoPan searchQuery={searchQuery} filteredPoints={filteredPoints} />
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MarkerClusterGroup chunkedLoading maxClusterRadius={60} spiderfyOnMaxZoom={false}>
            {filteredPoints.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={createMarkerIcon(p)} eventHandlers={{ click: () => setSelectedPoint(p) }} />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 space-y-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-4 text-xs">
          {TYPE_LABELS.map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[type] }} />
              {type}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 text-xs">
          <span className="text-slate-400 dark:text-slate-500">Status FAB:</span>
          {Object.entries(FAB_STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>
      </div>

      <PointDetailDrawer point={selectedPoint} onClose={() => setSelectedPoint(null)} />
    </div>
  );
}
