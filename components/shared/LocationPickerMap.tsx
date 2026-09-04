"use client";

// PENTING: import CSS Leaflet di sini (bukan di globals.css) supaya
// tidak melanggar aturan "Jangan mengubah global.css" dari standar kelompok.
import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";

// Custom marker icon yang lebih jelas dan terlihat
// FIX bawaan Leaflet: icon marker default suka pecah/hilang kalau dibundle
// lewat Webpack/Next.js karena path gambar internalnya nggak ketemu.
// @ts-expect-error - properti internal Leaflet, memang perlu dihapus manual
delete L.Icon.Default.prototype._getIconUrl;

// Custom icon dengan style yang lebih jelas
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Blue marker untuk lokasi GPS
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "leaflet-bluelayer-marker",
});

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  height?: string;
  /** Kalau diisi -> mode edit (marker bisa digeser & peta bisa diklik). */
  onChange?: (lat: number, lng: number) => void;
  /** Mode lihat saja (dipakai tombol "View") -> marker tidak bisa digeser. */
  readOnly?: boolean;
}

// Fix utama untuk "peta blank di dalam Dialog": Leaflet menghitung ukuran
// tile berdasarkan ukuran container SAAT peta pertama kali dirender. Kalau
// itu terjadi saat Dialog masih animasi buka (ukuran belum final) atau saat
// tombol Perbesar/Perkecil diklik, tile jadi salah/nggak muncul. ResizeObserver
// ini otomatis manggil invalidateSize() setiap kali ukuran container berubah.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {
        // Ignore errors during cleanup
      }
    });
    observer.observe(container);
    return () => {
      try {
        observer.disconnect();
      } catch {
        // Ignore errors during cleanup
      }
    };
  }, [map]);
  return null;
}

// Bikin peta otomatis re-center setiap kali lat/lng dari luar berubah
// (misal habis auto-geocode dari alamat).
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    try {
      map.setView([lat, lng], map.getZoom());
    } catch {
      // Ignore errors during map initialization
    }
  }, [lat, lng, map]);
  return null;
}

// Tangkap klik di peta -> pindahkan marker ke titik yang diklik.
function ClickToMove({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Guard component to ensure map is fully ready before rendering marker
function MapReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const map = useMap();

  useEffect(() => {
    // Small delay to ensure map is fully initialized
    const timer = setTimeout(() => {
      setReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  if (!ready) return null;
  return <>{children}</>;
}

export default function LocationPickerMap({
  lat,
  lng,
  height = "220px",
  onChange,
  readOnly = false,
}: LocationPickerMapProps) {
  // Validate coordinates - use defaults if invalid
  const validLat = !isNaN(lat) && lat !== 0;
  const validLng = !isNaN(lng) && lng !== 0;
  const defaultLat = validLat ? lat : -6.917464;
  const defaultLng = validLng ? lng : 107.619123;

  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0"
    >
      <style>{`
        .leaflet-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-marker-icon img {
          display: block !important;
        }
      `}</style>
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapReady>
          <Marker
            position={[defaultLat, defaultLng]}
            icon={customIcon}
            draggable={!readOnly}
            eventHandlers={
              !readOnly && onChange
                ? {
                    dragend: (e) => {
                      try {
                        const target = e.target as L.Marker;
                        const pos = target.getLatLng();
                        if (pos && onChange) {
                          onChange(pos.lat, pos.lng);
                        }
                      } catch {
                        // Ignore drag errors
                      }
                    },
                  }
                : undefined
            }
          />
        </MapReady>

        {!readOnly && onChange && <ClickToMove onChange={onChange} />}
        <RecenterOnChange lat={defaultLat} lng={defaultLng} />
        <InvalidateOnResize />
      </MapContainer>
    </div>
  );
}
