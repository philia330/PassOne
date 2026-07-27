"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import type { NetworkPoint } from "@/lib/network-points";
import { createMarkerIcon, TYPE_COLOR, FAB_STATUS_COLORS } from "@/lib/map-icons";

const TYPE_LABELS: NetworkPoint["type"][] = ["POP", "OLT", "ODP", "FAB"];

const FAB_STATUS_OPTIONS = ["PENDING", "SURVEY", "INSTALASI", "SELESAI"];

export default function NetworkMap({ points }: { points: NetworkPoint[] }) {
  const [activeTypes, setActiveTypes] = useState<Set<NetworkPoint["type"]>>(
    new Set(TYPE_LABELS)
  );
  const [fabStatusFilter, setFabStatusFilter] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      </div>
    </div>
  );
}