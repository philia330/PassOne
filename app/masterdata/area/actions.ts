"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Generate kode area otomatis: AR001, AR002, AR003, dst
 */
export async function getNextAreaCode(): Promise<string> {
  const areas = await prisma.area.findMany({
    where: { kode_area: { startsWith: "AR" } },
    select: { kode_area: true },
  });

  // Ambil semua angka dari kode yang ada, urutkan dari kecil ke besar
  const numbers = areas
    .map((area) => {
      const match = area.kode_area.match(/^AR(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  // Cari angka terkecil yang belum terpakai (mengisi celah/gap dari data yang dihapus)
  let next = 1;
  for (const num of numbers) {
    if (num === next) {
      next++;
    } else if (num > next) {
      break;
    }
  }

  return `AR${String(next).padStart(3, "0")}`;
}

/**
 * Server Action
 * Menyimpan data Area baru ke database (kode_area otomatis)
 */
export async function createArea(formData: FormData) {
  const nama_area = formData.get("nama_area")?.toString().trim() ?? "";
  const keterangan = formData.get("keterangan")?.toString().trim() || null;

  const kode_area = await getNextAreaCode();

  if (!nama_area) {
    throw new Error("Nama Area wajib diisi.");
  }

  await prisma.area.create({
    data: {
      kode_area,
      nama_area,
      keterangan,
    },
  });

  revalidatePath("/masterdata/area");
  redirect("/masterdata/area");
}

/**
 * Server Action
 * Update data Area
 */
export async function updateArea(id_area: number, formData: FormData) {
  const kode_area = formData.get("kode_area")?.toString().trim() ?? "";
  const nama_area = formData.get("nama_area")?.toString().trim() ?? "";
  const keterangan = formData.get("keterangan")?.toString().trim() || null;

  if (!kode_area || !nama_area) {
    throw new Error("Kode Area dan Nama Area wajib diisi.");
  }

  const cekArea = await prisma.area.findFirst({
    where: {
      kode_area,
      NOT: { id_area },
    },
  });

  if (cekArea) {
    throw new Error("Kode Area sudah digunakan.");
  }

  await prisma.area.update({
    where: { id_area },
    data: { kode_area, nama_area, keterangan },
  });

  revalidatePath("/masterdata/area");
  redirect("/masterdata/area");
}

/**
 * Server Action
 * Menghapus data Area berdasarkan id
 */
export async function deleteArea(id_area: number) {
  await prisma.area.delete({
    where: { id_area },
  });

  revalidatePath("/masterdata/area");
}