import { prisma } from "@/lib/prisma";

export type ConnectedFab = {
  id: string;
  name: string;
  status: string;
};

export type NetworkPoint = {
  id: string;
  type: "POP" | "OLT" | "ODP" | "FAB";
  name: string;
  lat: number;
  lng: number;
  info?: string;
  // relasi ke "induk" titik lain, dipakai buat gambar kabel.
  // - ODP -> OLT (satu induk): parentId
  // - OLT -> POP (satu induk): parentId
  // - FAB -> ODP (BISA lebih dari satu, dari histori BAA): parentIds
  parentId?: string;
  parentIds?: string[];
  // FAB yang terhubung ke ODP ini (untuk drawer detail ODP)
  connectedFabs?: ConnectedFab[];

  // ====== Detail lengkap buat drawer kanan (beda-beda per `type`) ======
  kode?: string;
  alamat?: string;
  lokasi?: string;
  foto?: string | null;
  no_hp?: string;
  nik?: string;
  jumlah_port?: number | null;
  port_terpakai?: number | null;
  createdAt?: string;
  // Kredensial OLT (cuma ada kalau type === "OLT")
  ip_olt?: string | null;
  username_olt?: string | null;
  password_olt?: string | null;
};

export async function getNetworkPoints(): Promise<NetworkPoint[]> {
  const [pops, olts, odps, fabs] = await Promise.all([
    prisma.pop.findMany({
      select: {
        id_pop: true,
        nama_pop: true,
        latitude: true,
        longitude: true,
        kode_pop: true,
        alamat: true,
        createdAt: true,
      },
    }),
    prisma.olt.findMany({
      select: {
        id_olt: true,
        nama_olt: true,
        latitude: true,
        longitude: true,
        id_pop: true,
        kode_olt: true,
        lokasi: true,
        foto_olt: true,
        ip_olt: true,
        username_olt: true,
        password_olt: true,
        createdAt: true,
      },
    }),
    prisma.odp.findMany({
      select: {
        id_odp: true,
        nama_odp: true,
        latitude: true,
        longitude: true,
        id_olt: true,
        kode_odp: true,
        alamat: true,
        jumlah_port: true,
        createdAt: true,
        _count: {
          select: { baa: true },
        },
      },
    }),
    prisma.fab.findMany({
      select: {
        id_fab: true,
        nama_pelanggan: true,
        latitude: true,
        longitude: true,
        status: true,
        kode_fab: true,
        alamat: true,
        no_hp: true,
        foto: true,
        nik: true,
        createdAt: true,
      },
    }),
  ]);

  // FAB tidak punya relasi langsung ke ODP -- harus lewat data BAA
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

  // Mapping FAB per ODP untuk drawer detail ODP
  const odpToFabsMap = new Map<number, ConnectedFab[]>();
  for (const fab of fabs) {
    const odpIds = fabToOdpMap.get(fab.id_fab);
    if (odpIds) {
      for (const odpId of odpIds) {
        if (!odpToFabsMap.has(odpId)) {
          odpToFabsMap.set(odpId, []);
        }
        odpToFabsMap.get(odpId)!.push({
          id: `fab-${fab.id_fab}`,
          name: fab.nama_pelanggan,
          status: fab.status,
        });
      }
    }
  }

  return [
    ...pops.map((p) => ({
      id: `pop-${p.id_pop}`,
      type: "POP" as const,
      name: p.nama_pop,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      kode: p.kode_pop,
      alamat: p.alamat,
      createdAt: p.createdAt.toISOString(),
    })),
    ...olts.map((o) => ({
      id: `olt-${o.id_olt}`,
      type: "OLT" as const,
      name: o.nama_olt,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      parentId: `pop-${o.id_pop}`,
      kode: o.kode_olt,
      lokasi: o.lokasi,
      foto: o.foto_olt,
      ip_olt: o.ip_olt,
      username_olt: o.username_olt,
      password_olt: o.password_olt,
      createdAt: o.createdAt.toISOString(),
    })),
    ...odps.map((o) => ({
      id: `odp-${o.id_odp}`,
      type: "ODP" as const,
      name: o.nama_odp,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      parentId: `olt-${o.id_olt}`,
      connectedFabs: odpToFabsMap.get(o.id_odp) ?? [],
      kode: o.kode_odp,
      alamat: o.alamat,
      jumlah_port: o.jumlah_port,
      // Port terpakai dihitung dari jumlah BAA yang terhubung
      port_terpakai: o._count.baa,
      createdAt: o.createdAt.toISOString(),
    })),
    ...fabs.map((f) => ({
      id: `fab-${f.id_fab}`,
      type: "FAB" as const,
      name: f.nama_pelanggan,
      lat: Number(f.latitude),
      lng: Number(f.longitude),
      info: f.status,
      parentIds: Array.from(fabToOdpMap.get(f.id_fab) ?? []).map((idOdp) => `odp-${idOdp}`),
      kode: f.kode_fab,
      alamat: f.alamat,
      no_hp: f.no_hp,
      nik: f.nik,
      foto: f.foto,
      createdAt: f.createdAt.toISOString(),
    })),
  ];
}