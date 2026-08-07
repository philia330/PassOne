import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { FabDialog } from "@/app/jaringan/fab/components/FabDialog";
import { FabTable } from "@/app/jaringan/fab/components/FabTable";

export default async function FabPage() {
  const session = await auth();

  const currentUser = {
    id_user: Number(session!.user.id_user),
    nama: session!.user.nama,
    role: session!.user.role,
  };

  const [rawFab, areaList, paketList, salesList, fabStats] = await Promise.all([
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

  // Statistik OPEN dan AKTIF
  const fabOpen = fabStats.find((s) => s.status === "OPEN")?._count.status ?? 0;
  const fabAktif = fabStats.find((s) => s.status === "AKTIF")?._count.status ?? 0;

  const kodeOtomatis = `FAB${String(fab.length + 1).padStart(3, "0")}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data FAB"
        description="Form Aktivasi Berlangganan — pengajuan pemasangan pelanggan"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total FAB - Purple gradient */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-500/20 overflow-hidden relative">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-white/80 font-medium">Total FAB</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight">{fab.length}</h2>
              <p className="mt-1 text-xs text-white/60">Pengajuan Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
              <ClipboardList className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        {/* Open - Sky/Cyan gradient */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/20 overflow-hidden relative">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-white/80 font-medium">Status Open</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight">{fabOpen}</h2>
              <p className="mt-1 text-xs text-white/60">Menunggu Aktivasi</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        {/* Aktif - Green gradient */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white shadow-lg shadow-green-500/20 overflow-hidden relative">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-white/80 font-medium">Status Aktif</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight">{fabAktif}</h2>
              <p className="mt-1 text-xs text-white/60">Sudah Terpasang</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
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
      />
    </div>
  );
}