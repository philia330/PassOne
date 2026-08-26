"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { z } from "zod";

const PAGE_SIZE = 10;

// ======================================================
// VALIDATION SCHEMA - Area
// ======================================================

const areaValidation = z.object({
  nama_area: z
    .string()
    .min(1, "Nama area wajib diisi.")
    .min(2, "Nama area minimal 2 karakter.")
    .max(100, "Nama area maksimal 100 karakter."),
  keterangan: z
    .string()
    .max(255, "Keterangan maksimal 255 karakter.")
    .optional()
    .nullable(),
});

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
 * HELPER: Cek hak akses
 * ======================================
 */
async function requireAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const role = session.user.role;
  if (role !== Role.ADMIN) {
    throw new Error("Anda tidak memiliki akses untuk mengelola Area.");
  }

  return session;
}

/**
 * ======================================
 * Generate kode Area otomatis
 * ======================================
 */
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

/**
 * ======================================
 * GET DATA
 * ======================================
 */
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

  return { data, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

/**
 * ======================================
 * CREATE AREA
 * ======================================
 */
export const createArea = async (formData: FormData) => {
  const session = await requireAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_area: (formData.get("nama_area") as string)?.trim() || "",
    keterangan: (formData.get("keterangan") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = areaValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Cek duplikat nama area
  const existing = await prisma.area.findFirst({
    where: {
      nama_area: validated.nama_area,
    },
  });

  if (existing) {
    throw new Error(`Area "${validated.nama_area}" sudah ada. Gunakan nama yang berbeda.`);
  }

  const kode_area = await generateKodeArea();

  await prisma.$transaction(async (tx) => {
    const existingInTx = await tx.area.findFirst({
      where: {
        nama_area: validated.nama_area,
      },
    });

    if (existingInTx) {
      throw new Error(`Area "${validated.nama_area}" sudah ada.`);
    }

    await tx.area.create({
      data: { kode_area, nama_area: validated.nama_area, keterangan: validated.keterangan || null },
    });
  });

  await logActivity("AREA_CREATED", `Area "${validated.nama_area}" dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};

/**
 * ======================================
 * UPDATE AREA
 * ======================================
 */
export const updateArea = async (id: number, formData: FormData) => {
  const session = await requireAccess();

  const existing = await prisma.area.findUnique({ where: { id_area: id } });
  if (!existing) {
    throw new Error("Area tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_area: (formData.get("nama_area") as string)?.trim() || "",
    keterangan: (formData.get("keterangan") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = areaValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Cek duplikat jika nama berubah
  if (validated.nama_area.toLowerCase() !== existing.nama_area.toLowerCase()) {
    const duplicate = await prisma.area.findFirst({
      where: {
        nama_area: validated.nama_area,
        id_area: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(`Area "${validated.nama_area}" sudah ada.`);
    }
  }

  await prisma.area.update({
    where: { id_area: id },
    data: { nama_area: validated.nama_area, keterangan: validated.keterangan || null },
  });

  await logActivity("AREA_UPDATED", `Area "${validated.nama_area}" diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};

/**
 * ======================================
 * DELETE AREA
 * ======================================
 */
export const deleteArea = async (id: number) => {
  const session = await requireAccess();

  const area = await prisma.area.findUnique({
    where: { id_area: id },
    include: { _count: { select: { fab: true, pop: true } } },
  });

  if (!area) {
    throw new Error("Area tidak ditemukan.");
  }

  // Cek apakah Area dipakai
  if (area._count.fab > 0 || area._count.pop > 0) {
    throw new Error(
      `Area "${area.nama_area}" tidak bisa dihapus karena masih dipakai oleh ${area._count.pop} POP dan ${area._count.fab} FAB.`
    );
  }

  await prisma.area.delete({ where: { id_area: id } });

  await logActivity("AREA_DELETED", `Area "${area.nama_area}" dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/area");
  revalidatePath("/workspace");
};
