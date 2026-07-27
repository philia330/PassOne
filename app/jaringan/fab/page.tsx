import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { FabDialog } from "@/app/jaringan/fab/components/FabDialog";
import { FabTable } from "@/app/jaringan/fab/components/FabTable";

export default async function FabPage() {
  // Ambil semua data yang dibutuhkan sekaligus (paralel, lebih cepat).
  // areaList, paketList, salesList cuma di-READ untuk isi dropdown —
  // TIDAK membuat/mengubah data User (itu tugas Project Lead).
  const [rawFab, areaList, paketList, salesList] = await Promise.all([
    prisma.fab.findMany({
      orderBy: { createdAt: "desc" },
      include: { area: true, paket: true, user: true },
    }),
    prisma.area.findMany({
      orderBy: { nama_area: "asc" },
      select: { id_area: true, nama_area: true },
    }),
    prisma.paket.findMany({
      orderBy: { nama_paket: "asc" },
      select: { id_paket: true, nama_paket: true },
    }),
    prisma.user.findMany({
      where: { role: "SALES" },
      orderBy: { nama: "asc" },
      select: { id_user: true, nama: true },
    }),
  ]);

  const fab = rawFab.map((item) => ({
    ...item,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
  }));

  // Preview doang di form Tambah — kode asli ditentukan renumberKodeFab()
  // di actions.ts setelah data benar-benar disimpan.
  const kodeOtomatis = `FAB${String(fab.length + 1).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="relative p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <Card className="flex-row relative overflow-hidden rounded-3xl shadow-xl border bg-white p-6 flex items-center justify-between">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
              <ClipboardList className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data FAB</h1>
              <p className="text-sm text-slate-500 font-medium">
                Form Aktivasi Berlangganan — pengajuan pemasangan pelanggan
              </p>
            </div>
          </div>

          <FabDialog
            mode="create"
            kodeOtomatis={kodeOtomatis}
            areaOptions={areaList}
            paketOptions={paketList}
            salesOptions={salesList}
          />
        </Card>

        <FabTable
          data={fab}
          areaOptions={areaList}
          paketOptions={paketList}
          salesOptions={salesList}
        />

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Sistem Manajemen FAB
        </p>
      </div>
    </div>
  );
}