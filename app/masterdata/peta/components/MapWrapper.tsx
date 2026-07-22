"use client";

import dynamic from "next/dynamic";
import type { NetworkMapProps } from "./NetworkMap";

// Leaflet butuh akses `window`, jadi harus di-load tanpa SSR
const NetworkMap = dynamic(
  () => import("./NetworkMap").then((mod) => mod.NetworkMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ aspectRatio: "16 / 7", width: "100%" }}
        className="flex items-center justify-center rounded-3xl border bg-white text-slate-400"
      >
        Memuat peta...
      </div>
    ),
  }
);

export const MapWrapper = (props: NetworkMapProps) => {
  return <NetworkMap {...props} />;
};