import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { getNetworkPoints } from "@/lib/network-points";
import NetworkMapLoader from "@/components/dashboard/network-map-loader";

export default async function NetworkMapPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const networkPoints = await getNetworkPoints();

  return (
    // min-h-screen + overflow-y-auto (bukan h-screen + overflow-hidden):
    // sekarang peta gak lagi dipaksa stretch mengisi SISA layar penuh
    // (flex-1), jadi tingginya tetap (lihat MAP_HEIGHT di bawah) berapa pun
    // ukuran layar. Kalau nanti ada konten tambahan di bawah peta yang bikin
    // halaman lebih panjang dari layar, halaman ini bisa di-scroll normal.
    <div className="flex min-h-screen flex-col">
      {/* Compact Header - smaller height */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Peta Jaringan
        </h1>
      </div>

      {/* Map -- tinggi tetap (fixed), gak lagi full-bleed mengisi sisa layar.
          Ganti angka "60vh" di bawah kalau mau lebih kecil/besar lagi
          (contoh: "500px" buat ukuran tetap dalam piksel, atau "50vh" buat
          lebih kecil lagi). */}
      <div className="overflow-hidden" style={{ height: "85vh" }}>
        <NetworkMapLoader points={networkPoints} fullHeight />
      </div>
    </div>
  );
}