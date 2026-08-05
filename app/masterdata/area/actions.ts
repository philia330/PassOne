"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// import { requireRole, requireAuth } from "@/lib/auth/guards"; // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge dari Project Lead
// import { logActivity } from "@/lib/activity-log"; // TODO: aktifkan lagi setelah lib/activity-log.ts & auth.ts di-merge dari Project Lead

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
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge — modul baca data minimal wajib login

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
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const kode_area = await generateKodeArea();
  const nama_area = formData.get("nama_area") as string;
  const keteranganRaw = formData.get("keterangan") as string;
  const keterangan = keteranganRaw.trim() ? keteranganRaw : null;

  const area = await prisma.area.create({
    data: { kode_area, nama_area, keterangan },
  });

  // await logActivity("AREA_CREATED", `Area ${area.nama_area} dibuat.`);

  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};

// ======================================================
// Update Area
// ======================================================
export const updateArea = async (id: number, formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const nama_area = formData.get("nama_area") as string;
  const keteranganRaw = formData.get("keterangan") as string;
  const keterangan = keteranganRaw.trim() ? keteranganRaw : null;

  const area = await prisma.area.update({
    where: { id_area: id },
    data: { nama_area, keterangan },
  });

  // await logActivity("AREA_UPDATED", `Area ${area.nama_area} diperbarui.`);

  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};

// ======================================================
// Hapus Area
// ======================================================
export const deleteArea = async (id: number) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const area = await prisma.area.delete({ where: { id_area: id } });

  // await logActivity("AREA_DELETED", `Area ${area.nama_area} dihapus.`);

  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};