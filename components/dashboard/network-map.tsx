"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  const [tileError, setTileError] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  // Ganti Math.random() + useRef di body render (melanggar react-hooks/purity
  // & react-hooks/refs) dengan useId() bawaan React, yang aman dipanggil saat
  // render dan hasilnya stabil sepanjang lifetime komponen.
  const reactId = useId();
  const mapId = `leaflet-map-${reactId.replace(/[^a-zA-Z0-9-]/g, "")}`;

  function toggleType(type: NetworkPoint["type"]) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  // Kalau drawer udah kebuka nampilin titik A, terus user klik titik B --
  // jangan langsung "loncat" ganti konten. Tutup dulu (biar animasi keluar
  // kejalan), baru sesudah durasi animasinya kelar (350ms di drawer + sedikit
  // buffer), baru buka lagi dengan data yang baru. Kalau belum ada yang lagi
  // kebuka (atau klik titik yang sama), langsung set aja tanpa delay.
  function handleMarkerClick(p: NetworkPoint) {
    if (selectedPoint && selectedPoint.id !== p.id) {
      setSelectedPoint(null);
      setTimeout(() => setSelectedPoint(p), 380);
    } else {
      setSelectedPoint(p);
    }
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
      {/*
        style={ transform: translateZ(0) } SENGAJA ditambahkan di sini.
        Leaflet menggerakkan tile peta pakai CSS transform: translate3d()
        (GPU-accelerated) setiap kali map di-klik/di-geser/di-zoom. Kombinasi
        ini dengan parent overflow-hidden bersarang (lihat NetworkMapPage) dan
        search bar yang juga punya properti `transition-all` adalah kombinasi
        yang dikenal punya bug compositing di browser Chromium: begitu tile
        peta di-pan/zoom, search bar (sibling-nya) gagal di-repaint dengan
        benar dan terlihat kosong sampai di-hard-refresh manual.
        translateZ(0) memaksa search bar punya GPU layer sendiri yang
        terisolasi dari perubahan layer si peta, sehingga tidak ikut kena
        imbas repaint yang salah.
      */}
      <div
        className="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        {/* isolate: bikin wrapper search punya stacking context sendiri.
            willChange: "transform" di icon & tombol X: keduanya pakai
            -translate-y-1/2 (CSS transform) buat center vertikal -- elemen
            kecil ber-transform absolute kayak gini paling sering jadi korban
            bug "vanish/gak ke-repaint" di Chromium waktu ada transform besar
            (pan/zoom peta) kejadian di dekatnya. willChange memaksa browser
            kasih GPU layer sendiri buat elemen ini dari awal. */}
        {/* isolate: bikin wrapper search punya stacking context sendiri.
            Icon di-center pakai flexbox (inset-y-0 + flex items-center),
            BUKAN transform (-translate-y-1/2) seperti sebelumnya -- supaya
            gak bentrok waktu icon-nya dianimasikan scale lewat Framer
            Motion (animasi scale juga jalan lewat CSS transform, jadi kalau
            dua-duanya sama-sama pakai transform buat hal yang beda,
            salah satu bakal ke-timpa). willChange: "transform" tetap
            dipasang di kontainer icon supaya dapat GPU layer sendiri,
            terisolasi dari transform besar punya peta pas di-pan/zoom. */}
        <div className="relative isolate">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" style={{ willChange: "transform" }}>
            <motion.div
              // Animasi "membesar sebentar lalu balik normal" -- muncul
              // sekali tiap kali komponen pertama kali muncul di layar.
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
            >
              <Search size={16} className="text-purple-500 dark:text-purple-400 transition-colors duration-200" />
            </motion.div>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama POP, OLT, ODP, atau pelanggan FAB..."
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            style={{ willChange: "transform" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 dark:text-slate-500 dark:hover:text-purple-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ willChange: "transform" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter controls */}
      <div
        className="flex-shrink-0 flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900/50"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div className="flex flex-wrap gap-2">
          {TYPE_LABELS.map((type) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${active ? "border-transparent text-white shadow-md scale-100 hover:scale-105 active:scale-95" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-600"}`}
                style={active ? { backgroundColor: TYPE_COLOR[type] } : undefined}
              >
                <span className="h-2 w-2 rounded-full transition-all duration-200" style={{ backgroundColor: active ? "white" : TYPE_COLOR[type] }} />
                {type}
              </button>
            );
          })}
        </div>
        {activeTypes.has("FAB") && (
          <select
            value={fabStatusFilter}
            onChange={(e) => setFabStatusFilter(e.target.value)}
            className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
          >
            <option value="ALL">Semua Status FAB</option>
            {FAB_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{filteredPoints.length} dari {points.length} titik</span>
      </div>

      {/* Map Container -- className "isolate" bikin Leaflet punya stacking &
          compositing context sendiri, jadi transform pan/zoom-nya gak
          "bocor" ke elemen sibling di luar wrapper ini.
          minHeight sekarang cuma jaring pengaman minimum (300px), BUKAN
          lagi maksa ketinggian besar (calc(100vh - 8rem)) -- ukuran
          sebenarnya sekarang mengikuti tinggi parent (diatur di halaman
          NetworkMapPage lewat flex-1 dari <div style={{ height: "60vh" }}>). */}
      <div className="relative flex-1 isolate" style={{ minHeight: fullHeight ? "300px" : "400px" }}>
        {tileError && (
          <div className="absolute inset-x-0 top-0 z-[1000] bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-300">
            Gagal memuat gambar peta (tile). Kemungkinan diblokir ad blocker/extension browser, atau koneksi internet
            ke tile.openstreetmap.org bermasalah. Coba nonaktifkan ad blocker atau buka di mode Incognito.
          </div>
        )}
        <MapContainer
          key={mapKey}
          id={mapId}
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
          scrollWheelZoom={true}
        >
          <MapAutoPan searchQuery={searchQuery} filteredPoints={filteredPoints} />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            eventHandlers={{
              tileerror: () => setTileError(true),
              tileload: () => setTileError(false),
            }}
          />
          <MarkerClusterGroup chunkedLoading maxClusterRadius={60} spiderfyOnMaxZoom={false}>
            {filteredPoints.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={createMarkerIcon(p)} eventHandlers={{ click: () => handleMarkerClick(p) }} />
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