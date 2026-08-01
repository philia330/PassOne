import L from "leaflet";
import type { NetworkPoint } from "@/lib/network-points";

export const FAB_STATUS_COLORS: Record<string, string> = {
  OPEN:  "#6ad2ff",   // merah — urgensi, perlu perhatian
  AKTIF: "#09ff01",   // hijau — sukses, selesai
};

export const TYPE_COLOR: Record<NetworkPoint["type"], string> = {
  POP: "#2327ff",
  OLT: "#0ea5e9",
  ODP: "#f59e0b",
  FAB: "#10b981",
};

// ...sisanya (TYPE_ICON_SVG, createMarkerIcon) tetap sama, tidak perlu diubah

// SVG path sederhana per tipe — bentuk beda-beda biar gampang dibedakan sekilas
const TYPE_ICON_SVG: Record<NetworkPoint["type"], string> = {
  // POP — bentuk hub/jaringan (lingkaran + titik)
  POP: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v6M12 13l-5 4M12 13l5 4"/></svg>`,
  // OLT — bentuk kotak perangkat dengan garis sinyal
  OLT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><rect x="4" y="8" width="16" height="10" rx="1"/><path d="M9 4v4M15 4v4M9 21h6"/></svg>`,
  // ODP — bentuk kotak distribusi
  ODP: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V6a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l3-1.7"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>`,
  // FAB — bentuk rumah/pelanggan
  FAB: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
};

export function createMarkerIcon(point: NetworkPoint) {
  const color =
    point.type === "FAB" && point.info
      ? FAB_STATUS_COLORS[point.info] ?? TYPE_COLOR.FAB
      : TYPE_COLOR[point.type];

  const svg = TYPE_ICON_SVG[point.type];

  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: ${color};
        border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${svg}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}