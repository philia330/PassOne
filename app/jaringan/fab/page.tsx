import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { FabDialog } from "@/app/jaringan/fab/components/FabDialog";
import { FabTable } from "@/app/jaringan/fab/components/FabTable";
import { ExportButton } from "@/components/ui/ExportButton";
import { StatCardsDropdown } from "@/components/dashboard/StatCardsDropdown";

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
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data FAB"
        description="Form Aktivasi Berlangganan — pengajuan pemasangan pelanggan"
      />

      {/* Statistik */}
      <StatCardsDropdown
        stats={[
          {
            icon: <ClipboardList className="h-8 w-8" />,
            label: "Total FAB",
            value: fab.length,
            sublabel: "Pengajuan Terdaftar",
          },
          {
            icon: <AlertCircle className="h-8 w-8" />,
            label: "Status Open",
            value: fabOpen,
            sublabel: "Menunggu Aktivasi",
          },
          {
            icon: <CheckCircle2 className="h-8 w-8" />,
            label: "Status Aktif",
            value: fabAktif,
            sublabel: "Sudah Terpasang",
          },
        ]}
      />

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