"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PAGE_SIZE = 10;

// ======================================================
// Generate kode_pop otomatis, mengisi celah nomor kosong
// Format: POP-001, POP-002, dst
// ======================================================
const generateKodePop = async (): Promise<string> => {
  const pops = await prisma.pop.findMany({
    select: { kode_pop: true },
    orderBy: { kode_pop: "asc" },
  });

  const numbers = pops
    .map((p) => parseInt(p.kode_pop.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `POP-${String(next).padStart(3, "0")}`;
};

// ======================================================
// Ambil data POP dengan search & pagination
// ======================================================
export const getPops = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { kode_pop: { contains: search } },
          { nama_pop: { contains: search } },
          { alamat: { contains: search } },
          { area: { nama_area: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.pop.findMany({
      where,
      include: { area: true },
      orderBy: { kode_pop: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pop.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Dropdown Area (select agar tidak bawa field lain yang tidak perlu)
// ======================================================
export const getAreas = async () => {
  return prisma.area.findMany({
    select: { id_area: true, nama_area: true },
    orderBy: { nama_area: "asc" },
  });
};

// ======================================================
// Tambah POP
// ======================================================
export const createPop = async (formData: FormData) => {
  const kode_pop = await generateKodePop();
  const nama_pop = formData.get("nama_pop") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_area = parseInt(formData.get("id_area") as string, 10);

  await prisma.pop.create({
    data: { kode_pop, nama_pop, alamat, latitude, longitude, id_area },
  });

  revalidatePath("/masterdata/pop");
};

// ======================================================
// Update POP
// ======================================================
export const updatePop = async (id: number, formData: FormData) => {
  const nama_pop = formData.get("nama_pop") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_area = parseInt(formData.get("id_area") as string, 10);

  await prisma.pop.update({
    where: { id_pop: id },
    data: { nama_pop, alamat, latitude, longitude, id_area },
  });

  revalidatePath("/masterdata/pop");
};

// ======================================================
// Hapus POP
// ======================================================
export const deletePop = async (id: number) => {
  await prisma.pop.delete({ where: { id_pop: id } });
  revalidatePath("/masterdata/pop");
};