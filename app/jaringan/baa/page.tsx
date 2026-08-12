import { redirect } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { BaaTable } from "@/app/jaringan/baa/components/BaaTable";

export default async function BaaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: session.user.role,
  };

  const [rawBaa, fabList, teknisiList, oltList, odpList, ontList, materialList] =
    await Promise.all([
      prisma.baa.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          fab: true,
          users: true,
          olt: true,
          odp: true,
          ont: true,
          baadetail: {
            include: {
              material: true,
            },
          },
          teknisiTambahan: {
            include: {
              users: {
                select: {
                  id_user: true,
                  nama: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      prisma.fab.findMany({
        where: { status: "OPEN" },
        orderBy: { nama_pelanggan: "asc" },
        select: { id_fab: true, kode_fab: true, nama_pelanggan: true },
      }),
      prisma.user.findMany({
        where: { role: "TEKNISI" },
        orderBy: { nama: "asc" },
        select: { id_user: true, nama: true, username: true },
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data BAA"
        description="Berita Acara Aktivasi — hasil instalasi pelanggan"
      />

     {/* Statistik */}
<div className="grid gap-4 md:grid-cols-3">
  <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm text-white/80">Total BAA</p>
        <h2 className="mt-2 text-4xl font-bold">{baa.length}</h2>
        <p className="mt-1 text-sm text-white/80">Instalasi Selesai</p>
      </div>
      <div className="rounded-2xl bg-white/20 p-4">
        <FileCheck2 className="h-8 w-8" />
      </div>
    </CardContent>
  </Card>
</div>

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