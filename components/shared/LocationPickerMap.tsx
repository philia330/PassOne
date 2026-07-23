"use client";

// PENTING: import CSS Leaflet di sini (bukan di globals.css) supaya
// tidak melanggar aturan "Jangan mengubah global.css" dari standar kelompok.
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";

// FIX bawaan Leaflet: icon marker default suka pecah/hilang kalau dibundle
// lewat Webpack/Next.js karena path gambar internalnya nggak ketemu.
// @ts-expect-error - properti internal Leaflet, memang perlu dihapus manual
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

// Bikin peta otomatis re-center setiap kali lat/lng dari luar berubah
// (misal habis auto-geocode dari alamat).
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
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

export default function LocationPickerMap({
  lat,
  lng,
  height = "220px",
  onChange,
  readOnly = false,
}: LocationPickerMapProps) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-200"
    >
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[lat, lng]}
          draggable={!readOnly}
          eventHandlers={
            !readOnly && onChange
              ? {
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    onChange(pos.lat, pos.lng);
                  },
                }
              : undefined
          }
        />

        {!readOnly && onChange && <ClickToMove onChange={onChange} />}
        <RecenterOnChange lat={lat} lng={lng} />
        <InvalidateOnResize />
      </MapContainer>
    </div>
  );
}