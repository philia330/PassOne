"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PAGE_SIZE = 10;

// ======================================================
// Generate kode_area otomatis, mengisi celah nomor kosong
// Format: AREA-001, AREA-002, dst
// ======================================================
const generateKodeArea = async (): Promise<string> => {
  const areas = await prisma.area.findMany({
    select: { kode_area: true },
    orderBy: { kode_area: "asc" },
  });

  const numbers = areas
    .map((a) => parseInt(a.kode_area.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `AREA-${String(next).padStart(3, "0")}`;
};

// ======================================================
// Ambil data Area dengan search & pagination
// ======================================================
export const getAreas = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { kode_area: { contains: search } },
          { nama_area: { contains: search } },
          { keterangan: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.area.findMany({
      where,
      orderBy: { kode_area: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.area.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Tambah Area
// ======================================================
export const createArea = async (formData: FormData) => {
  const kode_area = await generateKodeArea();
  const nama_area = formData.get("nama_area") as string;
  const keteranganRaw = formData.get("keterangan") as string;
  const keterangan = keteranganRaw.trim() ? keteranganRaw : null;

  await prisma.area.create({
    data: { kode_area, nama_area, keterangan },
  });

  revalidatePath("/masterdata/area");
};

// ======================================================
// Update Area
// ======================================================
export const updateArea = async (id: number, formData: FormData) => {
  const nama_area = formData.get("nama_area") as string;
  const keteranganRaw = formData.get("keterangan") as string;
  const keterangan = keteranganRaw.trim() ? keteranganRaw : null;

  await prisma.area.update({
    where: { id_area: id },
    data: { nama_area, keterangan },
  });

  revalidatePath("/masterdata/area");
};

// ======================================================
// Hapus Area
// ======================================================
export const deleteArea = async (id: number) => {
  await prisma.area.delete({ where: { id_area: id } });
  revalidatePath("/masterdata/area");
};