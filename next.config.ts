import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      // Tambah domain tile OpenStreetMap (a/b/c subdomain) supaya peta Leaflet bisa load gambar tile-nya.
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org; " +
      "font-src 'self' data:; " +
      // Tambah OSRM (router.project-osrm.org) karena network-map.tsx fetch rute jalan dari sana,
      // dan tile.openstreetmap.org juga dipanggil lewat fetch/XHR oleh Leaflet di beberapa kondisi.
      "connect-src 'self' ws: wss: https://router.project-osrm.org https://*.tile.openstreetmap.org; " +
      "frame-ancestors 'self';",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  // DIHAPUS: "Cross-Origin-Embedder-Policy: require-corp" mewajibkan SEMUA resource
  // cross-origin (termasuk tile gambar peta) mengirim header Cross-Origin-Resource-Policy
  // dari servernya. Server tile.openstreetmap.org tidak mengirim header itu, sehingga
  // browser akan tetap memblokir gambar tile peta meski img-src sudah diizinkan.
  // Kalau nanti butuh COEP lagi (misal untuk SharedArrayBuffer/WASM), pakai
  // "credentialless" sebagai gantinya, bukan "require-corp".
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;