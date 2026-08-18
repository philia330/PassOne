import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { FabDialog } from "@/app/jaringan/fab/components/FabDialog";
import { FabTable } from "@/app/jaringan/fab/components/FabTable";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function FabPage() {
  const session = await auth();

  const currentUser = {
    id_user: Number(session!.user.id_user),
    nama: session!.user.nama,
    role: session!.user.role,
  };

  const [rawFab, areaList, paketList, salesList, penginputListRaw, fabStats] = await Promise.all([
    prisma.fab.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        area: true,
        paket: true,
        users: true,
        penginput: true,
      },
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
    // Ambil semua user yang pernah menginput FAB (untuk filter)
    // Kita cari user yang ada di field penginput pada FAB
    prisma.fab.findMany({
      select: {
        penginput: {
          select: { id_user: true, nama: true },
        },
      },
      distinct: ["id_penginput"],
    }),
    prisma.fab.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const fab = rawFab.map((item) => ({
    ...item,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    paket: {
      ...item.paket,
      harga: Number(item.paket.harga),
    },
  }));

  // Process penginput list - ekstrak unique penginput dari hasil query
  const uniquePenginputMap = new Map<number, { id_user: number; nama: string }>();
  penginputListRaw.forEach((item) => {
    if (item.penginput) {
      uniquePenginputMap.set(item.penginput.id_user, item.penginput);
    }
  });
  const penginputList = Array.from(uniquePenginputMap.values());

  const fabOpen = fabStats.find((s) => s.status === "OPEN")?._count.status ?? 0;
  const fabAktif = fabStats.find((s) => s.status === "AKTIF")?._count.status ?? 0;

  const kodeOtomatis = `FAB${String(fab.length + 1).padStart(3, "0")}`;

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentUser.role === "ADMIN" || currentUser.role === "LEADER";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data FAB"
        description="Form Aktivasi Berlangganan — pengajuan pemasangan pelanggan"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total FAB</p>
              <h2 className="mt-2 text-4xl font-bold">{fab.length}</h2>
              <p className="mt-1 text-sm text-white/80">Pengajuan Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <ClipboardList className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Status Open</p>
              <h2 className="mt-2 text-4xl font-bold">{fabOpen}</h2>
              <p className="mt-1 text-sm text-white/80">Menunggu Aktivasi</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <AlertCircle className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Status Aktif</p>
              <h2 className="mt-2 text-4xl font-bold">{fabAktif}</h2>
              <p className="mt-1 text-sm text-white/80">Sudah Terpasang</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <FabTable
        data={fab}
        areaOptions={areaList}
        paketOptions={paketList}
        salesOptions={salesList}
        currentUser={currentUser}
        kodeOtomatis={kodeOtomatis}
        penginputOptions={penginputList}
        actions={canExport ? <ExportButton key="fab-export" apiUrl="/api/fab/export" filenamePrefix="Export_FAB" /> : null}
      />
    </div>
  );
}