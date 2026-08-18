"use client";

import { useState, useEffect } from "react";
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

type OltMapPickerProps = {
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
  useEffect(() => {
    try {
      map.flyTo([lat, lng], 16);
    } catch {
      // Ignore flyTo errors during initialization
    }
  }, [lat, lng, map]);
  return null;
};

// Guard to ensure map is ready before rendering marker
function MapReady({ children, hasPosition }: { children: React.ReactNode; hasPosition: boolean }) {
  const [ready, setReady] = useState(false);
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, [map]);

  if (!ready || !hasPosition) return null;
  return <>{children}</>;
}

export const OltMapPicker = ({ lat, lng, onPick }: OltMapPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const hasPosition = lat !== 0 && lng !== 0;
  const center: [number, number] = hasPosition
    ? [lat, lng]
    : [-6.9175, 107.6191];

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
            className="h-11 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-11 shrink-0 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleSelectResult(r)}
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <MapContainer
          center={center}
          zoom={hasPosition ? 15 : 12}
          style={{ height: "220px", width: "100%" }}
          className="w-full z-0 dark:[&_.leaflet-tile]:invert dark:[&_.leaflet-tile]:hue-rotate-180 dark:[&_.leaflet-tile]:brightness-95 dark:[&_.leaflet-tile]:contrast-90"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickHandler onPick={onPick} />
          <MapReady hasPosition={hasPosition}>
            <Marker position={[lat, lng]} icon={markerIcon} />
          </MapReady>
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
        </MapContainer>
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
          Cari tempat atau klik peta untuk pilih lokasi OLT
        </p>
      </div>
    </div>
  );
};