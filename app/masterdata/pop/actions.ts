"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

const PAGE_SIZE = 10;

// ======================================================
// VALIDATION SCHEMA - POP
// ======================================================

const popValidation = z.object({
  nama_pop: z
    .string()
    .min(1, "Nama POP wajib diisi.")
    .min(2, "Nama POP minimal 2 karakter.")
    .max(100, "Nama POP maksimal 100 karakter."),
  alamat: z
    .string()
    .min(1, "Alamat wajib diisi.")
    .min(5, "Alamat minimal 5 karakter.")
    .max(255, "Alamat maksimal 255 karakter."),
  latitude: z
    .number()
    .min(-90, "Latitude tidak valid.")
    .max(90, "Latitude tidak valid."),
  longitude: z
    .number()
    .min(-180, "Longitude tidak valid.")
    .max(180, "Longitude tidak valid."),
  id_area: z.number().int().positive("Area wajib dipilih."),
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
        type: type as ActivityType,
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
    throw new Error("Anda tidak memiliki akses untuk mengelola POP.");
  }

  return session;
}

/**
 * ======================================
 * Generate kode POP otomatis
 * ======================================
 */
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

/**
 * ======================================
 * GET DATA
 * ======================================
 */
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

  return { data, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

export const getAreas = async () => {
  return prisma.area.findMany({
    select: { id_area: true, nama_area: true },
    orderBy: { nama_area: "asc" },
  });
};

/**
 * ======================================
 * CREATE POP
 * ======================================
 */
export const createPop = async (formData: FormData) => {
  const session = await requireAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pop: (formData.get("nama_pop") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
  };

  // Parse validation
  const parseResult = popValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const kode_pop = await generateKodePop();

  await prisma.$transaction(async (tx) => {
    await tx.pop.create({
      data: {
        kode_pop,
        nama_pop: validated.nama_pop,
        alamat: validated.alamat,
        id_area: validated.id_area,
        latitude: validated.latitude,
        longitude: validated.longitude,
      },
    });
  });

  await logActivity("POP_CREATED", `POP "${validated.nama_pop}" (${kode_pop}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/pop");
};
/**
 * ======================================
 * UPDATE POP
 * ======================================
 */
export const updatePop = async (id: number, formData: FormData) => {
  const session = await requireAccess();

  const existing = await prisma.pop.findUnique({ where: { id_pop: id } });
  if (!existing) {
    throw new Error("POP tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pop: (formData.get("nama_pop") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
  };

  // Parse validation
  const parseResult = popValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  await prisma.pop.update({
    where: { id_pop: id },
    data: {
      nama_pop: validated.nama_pop,
      alamat: validated.alamat,
      id_area: validated.id_area,
      latitude: validated.latitude,
      longitude: validated.longitude,
    },
  });

  await logActivity("POP_UPDATED", `POP "${validated.nama_pop}" (${existing.kode_pop}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/pop");
};
/**
 * ======================================
 * DELETE POP
 * ======================================
 */
export const deletePop = async (id: number) => {
  const session = await requireAccess();

  const pop = await prisma.pop.findUnique({
    where: { id_pop: id },
    include: { _count: { select: { olt: true, ont: true } } },
  });

  if (!pop) {
    throw new Error("POP tidak ditemukan.");
  }

  // Cek apakah POP dipakai
  if (pop._count.olt > 0 || pop._count.ont > 0) {
    throw new Error(
      `POP "${pop.nama_pop}" tidak bisa dihapus karena masih dipakai oleh ${pop._count.olt} OLT dan ${pop._count.ont} ONT.`
    );
  }

  await prisma.pop.delete({ where: { id_pop: id } });

  await logActivity("POP_DELETED", `POP "${pop.nama_pop}" (${pop.kode_pop}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/pop");
};
