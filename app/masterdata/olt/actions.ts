"use server";
 
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
 
const PAGE_SIZE = 10;
 
// ======================================================
// Generate kode_olt otomatis, mengisi celah/gap nomor
// yang kosong. Format: OLT-001, OLT-002, dst
// ======================================================
const generateKodeOlt = async (): Promise<string> => {
  const olts = await prisma.olt.findMany({
    select: { kode_olt: true },
    orderBy: { kode_olt: "asc" },
  });
 
  const numbers = olts
    .map((o) => parseInt(o.kode_olt.split("-")[1], 10))
    .sort((a, b) => a - b);
 
  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }
 
  return `OLT-${String(next).padStart(3, "0")}`;
};
 
// Ambil data OLT dengan search & pagination, untuk Table + Search + Pagination
export const getOlts = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { kode_olt: { contains: search } },
          { nama_olt: { contains: search } },
          { lokasi: { contains: search } },
        ],
      }
    : {};
 
  const [data, total] = await Promise.all([
    prisma.olt.findMany({
      where,
      include: { pop: true },
      orderBy: { kode_olt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.olt.count({ where }),
  ]);
 
  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};
 
// Ambil daftar POP untuk dropdown Select pada Form Dialog
export const getPops = async () => {
  return prisma.pop.findMany({
    select: {
      id_pop: true,
      nama_pop: true,
    },
    orderBy: { nama_pop: "asc" },
  });
};
 
// Buat data OLT baru (dipanggil dari Create Dialog)
export const createOlt = async (formData: FormData) => {
  const kode_olt = await generateKodeOlt();
  const nama_olt = formData.get("nama_olt") as string;
  const lokasi = formData.get("lokasi") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
 
  await prisma.olt.create({
    data: { kode_olt, nama_olt, lokasi, latitude, longitude, id_pop },
  });
 
  revalidatePath("/masterdata/olt");
};
 
// Update data OLT (dipanggil dari Edit Dialog)
export const updateOlt = async (id: number, formData: FormData) => {
  const nama_olt = formData.get("nama_olt") as string;
  const lokasi = formData.get("lokasi") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
 
  await prisma.olt.update({
    where: { id_olt: id },
    data: { nama_olt, lokasi, latitude, longitude, id_pop },
  });
 
  revalidatePath("/masterdata/olt");
};
 
// Hapus data OLT (dipanggil dari Delete AlertDialog)
export const deleteOlt = async (id: number) => {
  await prisma.olt.delete({ where: { id_olt: id } });
  revalidatePath("/masterdata/olt");
};
 




