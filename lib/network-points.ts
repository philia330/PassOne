import { prisma } from "@/lib/prisma";

export type NetworkPoint = {
  id: string;
  type: "POP" | "OLT" | "ODP" | "FAB";
  name: string;
  lat: number;
  lng: number;
  info?: string;
};

export async function getNetworkPoints(): Promise<NetworkPoint[]> {
  const [pops, olts, odps, fabs] = await Promise.all([
    prisma.pop.findMany({ select: { id_pop: true, nama_pop: true, latitude: true, longitude: true } }),
    prisma.olt.findMany({ select: { id_olt: true, nama_olt: true, latitude: true, longitude: true } }),
    prisma.odp.findMany({ select: { id_odp: true, nama_odp: true, latitude: true, longitude: true } }),
    prisma.fab.findMany({
      select: { id_fab: true, nama_pelanggan: true, latitude: true, longitude: true, status: true },
    }),
  ]);

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
    })),
    ...odps.map((o) => ({
      id: `odp-${o.id_odp}`,
      type: "ODP" as const,
      name: o.nama_odp,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
    })),
    ...fabs.map((f) => ({
      id: `fab-${f.id_fab}`,
      type: "FAB" as const,
      name: f.nama_pelanggan,
      lat: Number(f.latitude),
      lng: Number(f.longitude),
      info: f.status,
    })),
  ];
}