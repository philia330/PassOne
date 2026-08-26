"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { optimizeImageToWebP } from "@/lib/image-utils";
import { z } from "zod";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fab");

// ======================================================
// FAB VALIDATION SCHEMA
// ======================================================

const fabValidation = z.object({
  nama_pelanggan: z
    .string()
    .min(1, "Nama pelanggan wajib diisi.")
    .min(2, "Nama pelanggan minimal 2 karakter.")
    .max(100, "Nama pelanggan maksimal 100 karakter."),
  nik: z
    .string()
    .min(1, "NIK wajib diisi.")
    .length(16, "NIK harus tepat 16 digit.")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka."),
  no_hp: z
    .string()
    .min(1, "Nomor HP wajib diisi.")
    .regex(/^(\+?62|0)[0-9]{9,14}$/, "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx")
    .max(15, "Nomor HP maksimal 15 karakter."),
  alamat: z
    .string()
    .min(1, "Alamat wajib diisi.")
    .min(10, "Alamat minimal 10 karakter.")
    .max(500, "Alamat maksimal 500 karakter."),
  latitude: z
    .number()
    .min(-90, "Latitude tidak valid.")
    .max(90, "Latitude tidak valid."),
  longitude: z
    .number()
    .min(-180, "Longitude tidak valid.")
    .max(180, "Longitude tidak valid."),
  id_area: z.number().int().positive("Area wajib dipilih."),
  id_paket: z.number().int().positive("Paket wajib dipilih."),
  id_user: z.number().int().positive("Sales wajib dipilih."),
});

/**
 * ======================================
 * HELPER: Simpan Foto (WebP optimized)
 * ======================================
 */
async function simpanFotoFab(fotoFile: File): Promise<string> {
  return optimizeImageToWebP(fotoFile, "fab");
}

/**
 * ======================================
 * HELPER: Audit Log
 * ======================================
 */
async function logActivity(type: string, description: string) {
  const session = await auth();
  try {
    await prisma.activityLog.create({
      data: {
        type: type as any,
        description,
        id_user: session?.user?.id_user as number,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

/**
 * ======================================
 * HELPER: Cek duplikat NIK (race condition safe)
 * ======================================
 */
async function checkNikDuplicate(nik: string, excludeId?: number): Promise<boolean> {
  const where: any = { nik };
  if (excludeId) {
    where.id_fab = { not: excludeId };
  }

  const existing = await prisma.fab.findFirst({ where });
  return !!existing;
}

/**
 * ======================================
 * HELPER: Renumber kode FAB
 * ======================================
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
 * CREATE FAB - dengan proteksi duplikat
 * ======================================
 */
export async function createFab(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pelanggan: (formData.get("nama_pelanggan") as string)?.trim() || "",
    nik: (formData.get("nik") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    id_paket: parseInt(formData.get("id_paket") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = fabValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const fotoFile = formData.get("foto") as File | null;

  if (!fotoFile || fotoFile.size === 0) {
    throw new Error("Foto depan rumah wajib diisi.");
  }

  // ======================================
  // CEK DUPLIKAT SEBELUM INSERT
  // ======================================
  const isDuplicate = await checkNikDuplicate(validated.nik);
  if (isDuplicate) {
    throw new Error(`NIK "${validated.nik}" sudah terdaftar. Gunakan NIK yang berbeda.`);
  }

  const status: "OPEN" | "AKTIF" = "OPEN";
  const id_penginput = Number(session.user.id_user);
  const id_user =
    session.user.role === "TEKNISI"
      ? validated.id_user
      : id_penginput;

  if (session.user.role === "TEKNISI" && !id_user) {
    throw new Error("Pilih sales referral terlebih dahulu.");
  }

  let fotoPath: string | undefined;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
  }

  const kodeSementara = `TMP-${Date.now()}`;

  // ======================================
  // TRANSACTION - atomic operation
  // ======================================
  try {
    await prisma.$transaction(async (tx) => {
      // Double-check NIK di dalam transaction (paling akurat)
      const existingInTx = await tx.fab.findFirst({
        where: { nik: validated.nik },
      });

      if (existingInTx) {
        throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
      }

      await tx.fab.create({
        data: {
          kode_fab: kodeSementara,
          nama_pelanggan: validated.nama_pelanggan,
          nik: validated.nik,
          no_hp: validated.no_hp,
          alamat: validated.alamat,
          latitude: validated.latitude,
          longitude: validated.longitude,
          status,
          id_area: validated.id_area,
          id_paket: validated.id_paket,
          id_user,
          id_penginput,
          foto: fotoPath,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar. Gunakan NIK yang berbeda.");
    }
    throw error;
  }

  await renumberKodeFab();
  await logActivity("FAB_CREATED", `FAB "${validated.nama_pelanggan}" (NIK: ${validated.nik}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * UPDATE FAB - dengan race condition protection
 * ======================================
 */
export async function updateFab(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Ambil data lama untuk audit
  const existingFab = await prisma.fab.findUnique({
    where: { id_fab: id },
  });

  if (!existingFab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  // Cek hak akses
  const isRestrictedRole = session.user.role === "SALES" || session.user.role === "TEKNISI";
  if (isRestrictedRole && existingFab.id_penginput !== Number(session.user.id_user)) {
    throw new Error("Anda tidak memiliki akses untuk mengubah data FAB ini.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pelanggan: (formData.get("nama_pelanggan") as string)?.trim() || "",
    nik: (formData.get("nik") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    id_paket: parseInt(formData.get("id_paket") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = fabValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // ======================================
  // CEK DUPLIKAT NIK (jika berubah)
  // ======================================
  if (validated.nik !== existingFab.nik) {
    const isDuplicate = await checkNikDuplicate(validated.nik, id);
    if (isDuplicate) {
      throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
    }
  }

  const id_user =
    session.user.role === "TEKNISI"
      ? validated.id_user
      : Number(session.user.id_user);

  let fotoPath: string | undefined;
  const fotoFile = formData.get("foto") as File | null;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Double-check NIK duplikat di dalam transaction
      if (validated.nik !== existingFab.nik) {
        const existingInTx = await tx.fab.findFirst({
          where: { nik: validated.nik, id_fab: { not: id } },
        });

        if (existingInTx) {
          throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
        }
      }

      await tx.fab.update({
        where: { id_fab: id },
        data: {
          nama_pelanggan: validated.nama_pelanggan,
          nik: validated.nik,
          no_hp: validated.no_hp,
          alamat: validated.alamat,
          latitude: validated.latitude,
          longitude: validated.longitude,
          id_area: validated.id_area,
          id_paket: validated.id_paket,
          id_user,
          ...(fotoPath ? { foto: fotoPath } : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar. Gunakan NIK yang berbeda.");
    }
    throw error;
  }

  await logActivity("FAB_UPDATED", `FAB "${validated.nama_pelanggan}" (NIK: ${validated.nik}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * DELETE FAB - dengan proteksi data terkait
 * ======================================
 */
export async function deleteFab(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role === "SALES" || session.user.role === "TEKNISI") {
    throw new Error("Anda tidak memiliki akses untuk menghapus data FAB.");
  }

  // Ambil data sebelum hapus untuk log
  const fab = await prisma.fab.findUnique({
    where: { id_fab: id },
    select: { nama_pelanggan: true, nik: true },
  });

  if (!fab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  const jumlahBaa = await prisma.baa.count({
    where: { id_fab: id },
  });

  if (jumlahBaa > 0) {
    throw new Error(
      `FAB "${fab.nama_pelanggan}" tidak bisa dihapus karena masih memiliki ${jumlahBaa} data BAA. Hapus atau pindahkan data BAA tersebut terlebih dahulu.`
    );
  }

  // Transaction untuk delete
  await prisma.$transaction(async (tx) => {
    await tx.fab.delete({ where: { id_fab: id } });
  });

  await renumberKodeFab();
  await logActivity("FAB_DELETED", `FAB "${fab.nama_pelanggan}" (NIK: ${fab.nik}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * DELETE MULTIPLE FAB
 * ======================================
 */
export async function deleteMultipleFab(ids: number[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role === "SALES" || session.user.role === "TEKNISI") {
    throw new Error("Anda tidak memiliki akses untuk menghapus data FAB.");
  }

  if (!ids || ids.length === 0) {
    throw new Error("Tidak ada data FAB yang dipilih.");
  }

  // Cek semua FAB yang akan dihapus
  const fabs = await prisma.fab.findMany({
    where: { id_fab: { in: ids } },
    select: { id_fab: true, nama_pelanggan: true },
  });

  if (fabs.length !== ids.length) {
    throw new Error("Beberapa data FAB tidak ditemukan.");
  }

  // Cek apakah ada yang masih memiliki BAA
  const fabsWithBaa = await Promise.all(
    fabs.map(async (fab) => {
      const count = await prisma.baa.count({ where: { id_fab: fab.id_fab } });
      return count > 0 ? fab : null;
    })
  );

  const fabsWithBaaFiltered = fabsWithBaa.filter(Boolean);
  if (fabsWithBaaFiltered.length > 0) {
    throw new Error(
      `${fabsWithBaaFiltered.length} FAB tidak bisa dihapus karena masih memiliki data BAA.`
    );
  }

  // Delete semua
  await prisma.$transaction(async (tx) => {
    await tx.fab.deleteMany({ where: { id_fab: { in: ids } } });
  });

  await renumberKodeFab();
  await logActivity("FAB_DELETED", `${ids.length} FAB dihapus oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
export async function getFabs(highlightId?: number | null) {
  const where = highlightId
    ? { id_fab: highlightId }
    : {};

  return prisma.fab.findMany({
    where,
    include: {
      area: true,
      paket: true,
      users: true,
      penginput: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
