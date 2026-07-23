"use server";

import { prisma } from "@/lib/prisma";

// ======================================================
// Ambil semua titik POP, OLT, ODP beserta relasi
// (id_pop di OLT, id_olt di ODP) untuk menggambar jalur
// ======================================================
export const getMapData = async () => {
  const pops = await prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true, latitude: true, longitude: true },
  });

  const olts = await prisma.olt.findMany({
    select: { id_olt: true, nama_olt: true, latitude: true, longitude: true, id_pop: true },
  });

  const odps = await prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true, latitude: true, longitude: true, id_olt: true },
  });

  return { pops, olts, odps };
};