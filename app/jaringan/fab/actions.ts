"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * ======================================
 * HELPER: Rapikan ulang kode_fab
 * ======================================
 * Pola sama seperti Paket & Material — supaya kode_fab selalu rapat
 * (FAB001, FAB002, ...) tanpa gap walau ada data yang dihapus.
 */
async function renumberKodeFab() {
  const semuaFab = await prisma.fab.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_fab: true },
  });

  await prisma.$transaction(
    semuaFab.map((item, i) =>
      prisma.fab.update({
        where: { id_fab: item.id_fab },
        data: { kode_fab: `FAB${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

/**
 * ======================================
 * CREATE FAB
 * ======================================
 */
export async function createFab(formData: FormData) {
  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const status = formData.get("status") as "PENDING" | "SURVEY" | "INSTALASI" | "SELESAI";
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const id_user = Number(formData.get("id_user"));

  if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket || !id_user) {
    throw new Error("Semua field wajib diisi.");
  }

  // Kode sementara dijamin unik, kode asli (FAB001, dst) diberikan lewat renumbering
  const kodeSementara = `TMP-${Date.now()}`;

  try {
    await prisma.fab.create({
      data: {
        kode_fab: kodeSementara,
        nama_pelanggan,
        nik,
        no_hp,
        alamat,
        latitude,
        longitude,
        status,
        id_area,
        id_paket,
        id_user,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  await renumberKodeFab();

  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * UPDATE FAB
 * ======================================
 */
export async function updateFab(id: number, formData: FormData) {
  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const status = formData.get("status") as "PENDING" | "SURVEY" | "INSTALASI" | "SELESAI";
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const id_user = Number(formData.get("id_user"));

  if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket || !id_user) {
    throw new Error("Semua field wajib diisi.");
  }

  try {
    await prisma.fab.update({
      where: { id_fab: id },
      data: {
        nama_pelanggan,
        nik,
        no_hp,
        alamat,
        latitude,
        longitude,
        status,
        id_area,
        id_paket,
        id_user,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * DELETE FAB
 * ======================================
 */
export async function deleteFab(id: number) {
  await prisma.fab.delete({ where: { id_fab: id } });

  await renumberKodeFab();

  revalidatePath("/jaringan/fab");
}