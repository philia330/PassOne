"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { NetworkPoint } from "@/lib/network-points";

const TYPE_COLOR: Record<NetworkPoint["type"], string> = {
  POP: "#6366f1",
  OLT: "#0ea5e9",
  ODP: "#f59e0b",
  FAB: "#10b981",
};

const TYPE_LABELS: NetworkPoint["type"][] = ["POP", "OLT", "ODP", "FAB"];

const FAB_STATUS_OPTIONS = ["PENDING", "SURVEY", "INSTALASI", "SELESAI"];

export default function NetworkMap({ points }: { points: NetworkPoint[] }) {
  const [activeTypes, setActiveTypes] = useState<Set<NetworkPoint["type"]>>(
    new Set(TYPE_LABELS)
  );
  const [fabStatusFilter, setFabStatusFilter] = useState<string | "ALL">("ALL");

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

  const [mapHeight, setMapHeight] = useState(450);

useEffect(() => {
  const updateHeight = () => {
    setMapHeight(window.innerWidth < 640 ? 320 : 450);
  };

  updateHeight();

  window.addEventListener("resize", updateHeight);

  return () => {
    window.removeEventListener("resize", updateHeight);
  };
}, []);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (!activeTypes.has(p.type)) return false;

      if (p.type === "FAB" && fabStatusFilter !== "ALL") {
        return p.info === fabStatusFilter;
      }

      return true;
    });
  }, [points, activeTypes, fabStatusFilter]);

  const center: [number, number] =
    filteredPoints.length > 0
      ? [filteredPoints[0].lat, filteredPoints[0].lng]
      : points.length > 0
      ? [points[0].lat, points[0].lng]
      : [-6.9147, 107.6098];

return (
  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">

    {/* ================= HEADER FILTER ================= */}

    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">

      {/* Filter Jenis */}
      <div className="flex flex-wrap gap-2">

        {TYPE_LABELS.map((type) => {
          const active = activeTypes.has(type);

          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                active
                  ? "border-transparent text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
              style={
                active
                  ? {
                      backgroundColor: TYPE_COLOR[type],
                    }
                  : undefined
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: active
                    ? "white"
                    : TYPE_COLOR[type],
                }}
              />

              {type}
            </button>
          );
        })}
      </div>

      {/* Filter Status FAB */}

      {activeTypes.has("FAB") && (
        <select
          value={fabStatusFilter}
          onChange={(e) =>
            setFabStatusFilter(e.target.value)
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto"
        >
          <option value="ALL">
            Semua Status FAB
          </option>

          {FAB_STATUS_OPTIONS.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>
      )}

    </div>

    {/* Counter */}

    <div className="border-b border-slate-100 bg-white px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">

      Menampilkan
      <span className="mx-1 font-semibold text-slate-700 dark:text-slate-200">
        {filteredPoints.length}
      </span>

      dari

      <span className="mx-1 font-semibold text-slate-700 dark:text-slate-200">
        {points.length}
      </span>

      titik jaringan.

    </div>

    {/* ================= MAP ================= */}
    <MapContainer
      key={`${center[0]}-${center[1]}`}
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="z-0"
      style={{
        width: "100%",
        height: mapHeight,
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {filteredPoints.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.lat, point.lng]}
          radius={7}
          pathOptions={{
            color: TYPE_COLOR[point.type],
            fillColor: TYPE_COLOR[point.type],
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>

            <div className="min-w-[180px]">

              <h3 className="font-semibold text-slate-800">
                {point.name}
              </h3>

              <div className="mt-2 space-y-1 text-sm">

                <p>
                  <span className="font-medium">
                    Tipe :
                  </span>{" "}
                  {point.type}
                </p>

                {point.info && (
                  <p>
                    <span className="font-medium">
                      Status :
                    </span>{" "}
                    {point.info}
                  </p>
                )}

                <p>
                  <span className="font-medium">
                    Latitude :
                  </span>{" "}
                  {point.lat}
                </p>

                <p>
                  <span className="font-medium">
                    Longitude :
                  </span>{" "}
                  {point.lng}
                </p>

              </div>

            </div>

          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>

    {/* ================= LEGEND ================= */}

    <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Keterangan
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-5">

        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <div
            key={type}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: color,
              }}
            />

            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {type}
            </span>
          </div>
        ))}

      </div>

    </div>

  </div>
);
}