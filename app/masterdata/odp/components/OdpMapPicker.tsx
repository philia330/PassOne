"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type OdpMapPickerProps = {
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

// Komponen kecil untuk geser center peta secara imperatif dengan error handling
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

export const OdpMapPicker = ({ lat, lng, onPick }: OdpMapPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

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
    <div className="space-y-3">
      {/* Search box */}
      <div className="relative">
        <div className={`flex gap-2 p-1 rounded-2xl border transition-all duration-200 ${
          searchFocused
            ? 'border-purple-500 shadow-[0_0_0_3px_rgba(147,51,234,0.1)]'
            : 'border-slate-200 dark:border-slate-700'
        } bg-white dark:bg-slate-800`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors duration-200" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Cari nama tempat / alamat..."
              className="h-9 pl-10 pr-4 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-9 shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 text-white hover:opacity-90 active:scale-95 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="absolute z-[1000] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-900">
            {results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleSelectResult(r)}
                className="block w-full cursor-pointer px-4 py-3 text-left text-sm text-slate-700 hover:bg-purple-50 transition-colors duration-150 dark:text-slate-200 dark:hover:bg-purple-900/20 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 transition-all duration-200 hover:shadow-lg">
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
        <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 py-2.5 dark:border-slate-800 dark:from-slate-800 dark:to-slate-800/50">
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3 w-3 text-purple-500" />
            Klik peta untuk pilih lokasi atau cari alamat di atas
          </p>
        </div>
      </div>
    </div>
  );
};