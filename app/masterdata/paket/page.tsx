import { Router } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { PaketDialog } from "@/app/masterdata/paket/components/PaketDialog";
import { PaketTable } from "@/app/masterdata/paket/components/PaketTable";

export default async function PaketPage() {
  const rawPaket = await prisma.paket.findMany({ orderBy: { createdAt: "desc" } });

  const paket = rawPaket.map((item) => ({
    ...item,
    harga: Number(item.harga),
  }));

  const kodeOtomatis = `PKT${String(paket.length + 1).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      {/* Dekorasi blur gradient di background — subtle depth, tetap dalam palet purple/fuchsia/sky */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="relative p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header — dipaksa flex-row karena Card default-nya flex-col */}
        <Card className="flex-row relative overflow-hidden rounded-3xl shadow-xl border bg-white p-6 flex items-center justify-between">
          {/* Aksen strip gradient di tepi atas card */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
              <Router className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Paket Internet</h1>
              <p className="text-sm text-slate-500 font-medium">Kelola seluruh data paket internet PASSNET</p>
            </div>
          </div>

          <PaketDialog mode="create" kodeOtomatis={kodeOtomatis} />
        </Card>

        {/* Kartu statistik (Paket Aktif & Terakhir Update) dihapus.
            Total Paket sekarang ditampilkan di PaketTable, nempel di sebelah pagination. */}

        <PaketTable data={paket} />

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Sistem Manajemen Paket Internet
        </p>
      </div>
    </div>
  );
}