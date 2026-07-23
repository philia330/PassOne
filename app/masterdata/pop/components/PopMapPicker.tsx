"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type PopMapPickerProps = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const ClickHandler = ({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const FlyTo = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  map.flyTo([lat, lng], 16);
  return null;
};

export const PopMapPicker = ({ lat, lng, onPick }: PopMapPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const hasPosition = lat !== 0 && lng !== 0;
  const center: [number, number] = hasPosition
    ? [lat, lng]
    : [-6.9175, 107.6191]; // fallback: Bandung

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=id`
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    onPick(newLat, newLng);
    setFlyTarget({ lat: newLat, lng: newLng });
    setResults([]);
    setQuery(result.display_name);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Cari nama tempat / alamat..."
            className="h-11 rounded-2xl border-slate-200 focus-visible:ring-purple-500"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-11 shrink-0 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-2xl border bg-white shadow-lg">
            {results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleSelectResult(r)}
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <MapContainer
          center={center}
          zoom={hasPosition ? 15 : 12}
          style={{ height: "220px", width: "100%" }}
          className="w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <ClickHandler onPick={onPick} />
          {hasPosition && <Marker position={[lat, lng]} icon={markerIcon} />}
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
        </MapContainer>
        <p className="bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
          Cari tempat atau klik peta untuk pilih lokasi POP
        </p>
      </div>
    </div>
  );
};