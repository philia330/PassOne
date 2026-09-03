import { redirect } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { BaaTable } from "@/app/jaringan/baa/components/BaaTable";
import { StatCardsDropdown } from "@/components/dashboard/StatCardsDropdown";
import { getBaaData } from "./actions";

export default async function BaaPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: session.user.role,
  };

  const [rawBaa, fabList, teknisiList, oltList, odpList, ontList, materialList] =
    await Promise.all([
      getBaaData(highlightId),
      prisma.fab.findMany({
        where: { status: "OPEN" },
        orderBy: { nama_pelanggan: "asc" },
        select: { id_fab: true, kode_fab: true, nama_pelanggan: true },
      }),
      prisma.user.findMany({
        where: { role: "TEKNISI" },
        orderBy: { nama: "asc" },
        select: { id_user: true, nama: true, username: true, foto: true },
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
        // Hanya tampilkan ONT yang benar-benar siap dipakai: status TERSEDIA
        // dan belum dipakai oleh BAA manapun. ONT yang sedang dipakai BAA yang
        // lagi diedit tetap muncul lewat mergedOntOptions di BaaForm.
        where: {
          status: "TERSEDIA",
          baa: { none: {} },
        },
        orderBy: { serial_number: "asc" },
        select: { id_ont: true, serial_number: true, pelanggan: true },
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
    fab: {
      ...item.fab,
      latitude: Number(item.fab.latitude),
      longitude: Number(item.fab.longitude),
    },
    olt: {
      ...item.olt,
      latitude: Number(item.olt.latitude),
      longitude: Number(item.olt.longitude),
    },
    odp: {
      ...item.odp,
      latitude: Number(item.odp.latitude),
      longitude: Number(item.odp.longitude),
    },
    baadetail: item.baadetail.map((d) => ({
      ...d,
      material: {
        ...d.material,
        harga: Number(d.material.harga),
      },
    })),
  }));

  // Buat daftar teknisi unik dari data BAA untuk filter
  const uniqueTeknisiMap = new Map<number, { id_user: number; nama: string; username?: string }>();
  baa.forEach((item) => {
    if (item.users) {
      uniqueTeknisiMap.set(item.users.id_user, item.users);
    }
    // Include teknisi tambahan
    item.teknisiTambahan?.forEach((tk) => {
      if (tk.users) {
        uniqueTeknisiMap.set(tk.users.id_user, tk.users);
      }
    });
  });
  const uniqueTeknisiList = Array.from(uniqueTeknisiMap.values());

  const kodeOtomatis = `BAA${String(baa.length + 1).padStart(3, "0")}`;

  // Ubah semua data yang mengandung Decimal jadi Plain Object dalam 1 baris.
  const [sanitizedFab, sanitizedOlt, sanitizedOdp, sanitizedMaterial] = [
    fabList,
    oltList,
    odpList,
    materialList,
  ].map((list) => JSON.parse(JSON.stringify(list)));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data BAA"
        description="Berita Acara Aktivasi — hasil instalasi pelanggan"
      />

     {/* Statistik */}
      <StatCardsDropdown
        stats={[
          {
            icon: <FileCheck2 className="h-8 w-8" />,
            label: "Total BAA",
            value: baa.length,
            sublabel: "Instalasi Selesai",
          },
        ]}
      />

      <BaaTable
        data={baa}
        fabOptions={sanitizedFab}
        teknisiOptions={teknisiList}
        oltOptions={sanitizedOlt}
        odpOptions={sanitizedOdp}
        ontOptions={ontList}
        materialOptions={sanitizedMaterial}
        currentUser={currentUser}
        kodeOtomatis={kodeOtomatis}
        allTeknisiOptions={uniqueTeknisiList}
      />
    </div>
  );
}