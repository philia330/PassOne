"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { z } from "zod";

const PAGE_SIZE = 10;

// ======================================================
// VALIDATION SCHEMA - ODP
// ======================================================

const odpValidation = z.object({
  nama_odp: z
    .string()
    .min(1, "Nama ODP wajib diisi.")
    .min(2, "Nama ODP minimal 2 karakter.")
    .max(100, "Nama ODP maksimal 100 karakter."),
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
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  jumlah_port: z
    .number()
    .int("Jumlah port harus berupa angka bulat.")
    .min(1, "Jumlah port minimal 1.")
    .max(256, "Jumlah port maksimal 256."),
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
    throw new Error("Anda tidak memiliki akses untuk mengelola ODP.");
  }

  return session;
}

/**
 * ======================================
 * Generate kode ODP otomatis
 * ======================================
 */
const generateKodeOdp = async (): Promise<string> => {
  const odps = await prisma.odp.findMany({
    select: { kode_odp: true },
    orderBy: { kode_odp: "asc" },
  });

  const numbers = odps
    .map((o) => parseInt(o.kode_odp.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `ODP-${String(next).padStart(3, "0")}`;
};

/**
 * ======================================
 * GET DATA
 * ======================================
 */
type OdpWithOlt = Awaited<ReturnType<typeof prisma.odp.findFirst>> & {
  olt?: { id_olt: number; nama_olt: string; latitude: number; longitude: number } | null;
};

export const getOdps = async (
  search: string = "",
  page: number = 1,
  includeCounts: boolean = false,
  sortOrder: "asc" | "desc" = "asc"
) => {
  const where = search
    ? {
        OR: [
          { kode_odp: { contains: search } },
          { nama_odp: { contains: search } },
          { alamat: { contains: search } },
          { olt: { nama_olt: { contains: search } } },
        ],
      }
    : {};

  const include: any = { olt: true };

  if (includeCounts) {
    include._count = {
      select: { ont: true, baa: true },
    };
  }

  const [data, total] = await Promise.all([
    prisma.odp.findMany({
      where,
      include,
      orderBy: { kode_odp: sortOrder },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.odp.count({ where }),
  ]);

  return { data: data as (OdpWithOlt & { _count?: { ont: number; baa: number } })[], total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

export const getOlts = async () => {
  return prisma.olt.findMany({
    select: { id_olt: true, nama_olt: true },
    orderBy: { nama_olt: "asc" },
  });
};

/**
 * ======================================
 * CREATE ODP
 * ======================================
 */
export const createOdp = async (formData: FormData) => {
  const session = await requireAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_odp: (formData.get("nama_odp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    jumlah_port: parseFloat(formData.get("jumlah_port") as string) || 0,
  };

  // Parse validation
  const parseResult = odpValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const kode_odp = await generateKodeOdp();

  await prisma.$transaction(async (tx) => {
    await tx.odp.create({
      data: {
        kode_odp,
        nama_odp: validated.nama_odp,
        alamat: validated.alamat,
        latitude: validated.latitude,
        longitude: validated.longitude,
        id_olt: validated.id_olt,
        jumlah_port: validated.jumlah_port,
      },
    });
  });

  await logActivity("ODP_CREATED", `ODP "${validated.nama_odp}" (${kode_odp}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/odp");
};

/**
 * ======================================
 * UPDATE ODP
 * ======================================
 */
export const updateOdp = async (id: number, formData: FormData) => {
  const session = await requireAccess();

  const existing = await prisma.odp.findUnique({ where: { id_odp: id } });
  if (!existing) {
    throw new Error("ODP tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_odp: (formData.get("nama_odp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    jumlah_port: parseFloat(formData.get("jumlah_port") as string) || 0,
  };

  // Parse validation
  const parseResult = odpValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  await prisma.odp.update({
    where: { id_odp: id },
    data: {
      nama_odp: validated.nama_odp,
      alamat: validated.alamat,
      latitude: validated.latitude,
      longitude: validated.longitude,
      id_olt: validated.id_olt,
      jumlah_port: validated.jumlah_port,
    },
  });

  await logActivity("ODP_UPDATED", `ODP "${validated.nama_odp}" (${existing.kode_odp}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/odp");
};

/**
 * ======================================
 * DELETE ODP
 * ======================================
 */
export const deleteOdp = async (id: number) => {
  const session = await requireAccess();

  const odp = await prisma.odp.findUnique({
    where: { id_odp: id },
    include: { _count: { select: { baa: true, ont: true } } },
  });

  if (!odp) {
    throw new Error("ODP tidak ditemukan.");
  }

  // Cek apakah ODP dipakai
  if (odp._count.baa > 0 || odp._count.ont > 0) {
    throw new Error(
      `ODP "${odp.nama_odp}" tidak bisa dihapus karena masih dipakai oleh ${odp._count.baa} BAA dan ${odp._count.ont} ONT.`
    );
  }

  await prisma.odp.delete({ where: { id_odp: id } });

  await logActivity("ODP_DELETED", `ODP "${odp.nama_odp}" (${odp.kode_odp}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/odp");
};
