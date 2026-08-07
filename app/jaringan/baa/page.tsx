import { FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { BaaTable } from "@/app/jaringan/baa/components/BaaTable";

export default async function BaaPage() {
  const session = await auth();
  const currentUser = {
    id_user: Number(session!.user.id_user),
    nama: session!.user.nama,
    role: session!.user.role,
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
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-500/20 overflow-hidden relative">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-white/80 font-medium">Total BAA</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight">{baa.length}</h2>
              <p className="mt-1 text-xs text-white/60">Instalasi Selesai</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
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
      />
    </div>
  );
}