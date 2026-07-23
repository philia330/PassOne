import { FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { BaaDialog } from "@/components/dialogs/BaaDialog";
import { BaaTable } from "@/components/tables/BaaTable";

export default async function BaaPage() {
  const [rawBaa, fabList, teknisiList, oltList, odpList, ontList, materialList] =
    await Promise.all([
      prisma.baa.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          fab: true,
          user: true,
          olt: true,
          odp: true,
          ont: true,
          baaDetails: { include: { material: true } },
        },
      }),
      prisma.fab.findMany({
        orderBy: { nama_pelanggan: "asc" },
        select: { id_fab: true, kode_fab: true, nama_pelanggan: true },
      }),
      prisma.user.findMany({
        where: { role: "TEKNISI" },
        orderBy: { nama: "asc" },
        select: { id_user: true, nama: true },
      }),
      prisma.olt.findMany({
        orderBy: { nama_olt: "asc" },
        select: { id_olt: true, nama_olt: true },
      }),
      prisma.odp.findMany({
        orderBy: { nama_odp: "asc" },
        select: { id_odp: true, nama_odp: true },
      }),
      prisma.ont.findMany({
        orderBy: { serial_number: "asc" },
        select: { id_ont: true, serial_number: true },
      }),
      prisma.material.findMany({
        orderBy: { nama_material: "asc" },
        select: { id_material: true, nama_material: true, satuan: true },
      }),
    ]);

  const baa = rawBaa.map((item) => ({
    ...item,
    rx_power_dbm: item.rx_power_dbm ? Number(item.rx_power_dbm) : null,
    tx_power_dbm: item.tx_power_dbm ? Number(item.tx_power_dbm) : null,
    ping_ms: item.ping_ms ? Number(item.ping_ms) : null,
  }));

  const kodeOtomatis = `BAA${String(baa.length + 1).padStart(3, "0")}`;

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
              <FileCheck2 className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data BAA</h1>
              <p className="text-sm text-slate-500 font-medium">
                Berita Acara Aktivasi — hasil instalasi pelanggan
              </p>
            </div>
          </div>

          <BaaDialog
            mode="create"
            kodeOtomatis={kodeOtomatis}
            fabOptions={fabList}
            teknisiOptions={teknisiList}
            oltOptions={oltList}
            odpOptions={odpList}
            ontOptions={ontList}
            materialOptions={materialList}
          />
        </Card>

        <BaaTable
          data={baa}
          fabOptions={fabList}
          teknisiOptions={teknisiList}
          oltOptions={oltList}
          odpOptions={odpList}
          ontOptions={ontList}
          materialOptions={materialList}
        />

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Sistem Manajemen BAA
        </p>
      </div>
    </div>
  );
}