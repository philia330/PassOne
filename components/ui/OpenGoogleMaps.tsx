"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type OpenGoogleMapsProps = {
  lat: number;
  lng: number;
  name?: string;
};

export function OpenGoogleMaps({ lat, lng, name }: OpenGoogleMapsProps) {
  const openGoogleMaps = () => {
    // Format URL untuk Google Maps (di browser akan terbuka otomatis)
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openGoogleMaps}
      title={name ? `Buka ${name} di Google Maps` : "Buka di Google Maps"}
      className="cursor-pointer rounded-xl hover:bg-sky-50 dark:hover:bg-sky-500/20 group transition-all duration-200"
    >
      <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400 group-hover:scale-125 transition-transform duration-200" />
    </Button>
  );
}
