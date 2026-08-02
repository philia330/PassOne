import { prisma } from "@/lib/prisma";

export type NetworkPoint = {
  id: string;
  type: "POP" | "OLT" | "ODP" | "FAB";
  name: string;
  lat: number;
  lng: number;
  info?: string;
  // ✅ BARU: relasi ke "induk" titik lain, dipakai buat gambar kabel.
  // - ODP -> OLT (satu induk): parentId
  // - OLT -> POP (satu induk): parentId
  // - FAB -> ODP (BISA lebih dari satu, dari histori BAA): parentIds
  parentId?: string;
  parentIds?: string[];
};

export async function getNetworkPoints(): Promise<NetworkPoint[]> {
  const [pops, olts, odps, fabs] = await Promise.all([
    prisma.pop.findMany({ select: { id_pop: true, nama_pop: true, latitude: true, longitude: true } }),
    // ✅ tambah id_pop, buat tau OLT ini nempel ke POP mana
    prisma.olt.findMany({
      select: { id_olt: true, nama_olt: true, latitude: true, longitude: true, id_pop: true },
    }),
    // ✅ tambah id_olt, buat tau ODP ini nempel ke OLT mana
    prisma.odp.findMany({
      select: { id_odp: true, nama_odp: true, latitude: true, longitude: true, id_olt: true },
    }),
    prisma.fab.findMany({
      select: { id_fab: true, nama_pelanggan: true, latitude: true, longitude: true, status: true },
    }),
  ]);

  // ✅ FAB tidak punya relasi langsung ke ODP -- harus lewat data BAA
  // (baa.id_fab + baa.id_odp). Satu FAB bisa punya lebih dari 1 BAA
  // (riwayat instalasi ulang dll), jadi kita kumpulkan SEMUA id_odp
  // yang pernah terhubung ke FAB tersebut.
  const fabIds = fabs.map((f) => f.id_fab);
  const baaList = await prisma.baa.findMany({
    where: { id_fab: { in: fabIds } },
    select: { id_fab: true, id_odp: true },
  });

  const fabToOdpMap = new Map<number, Set<number>>();
  for (const b of baaList) {
    if (!fabToOdpMap.has(b.id_fab)) {
      fabToOdpMap.set(b.id_fab, new Set());
    }
    fabToOdpMap.get(b.id_fab)!.add(b.id_odp);
  }

  return [
    ...pops.map((p) => ({
      id: `pop-${p.id_pop}`,
      type: "POP" as const,
      name: p.nama_pop,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
    })),
    ...olts.map((o) => ({
      id: `olt-${o.id_olt}`,
      type: "OLT" as const,
      name: o.nama_olt,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      parentId: `pop-${o.id_pop}`,
    })),
    ...odps.map((o) => ({
      id: `odp-${o.id_odp}`,
      type: "ODP" as const,
      name: o.nama_odp,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      parentId: `olt-${o.id_olt}`,
    })),
    ...fabs.map((f) => ({
      id: `fab-${f.id_fab}`,
      type: "FAB" as const,
      name: f.nama_pelanggan,
      lat: Number(f.latitude),
      lng: Number(f.longitude),
      info: f.status,
      parentIds: Array.from(fabToOdpMap.get(f.id_fab) ?? []).map((idOdp) => `odp-${idOdp}`),
    })),
  ];
}