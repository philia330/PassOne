"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const PAGE_SIZE = 10;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "olt");

// ======================================================
// VALIDATION SCHEMA - OLT
// ======================================================

const oltValidation = z.object({
  nama_olt: z
    .string()
    .min(1, "Nama OLT wajib diisi.")
    .min(2, "Nama OLT minimal 2 karakter.")
    .max(100, "Nama OLT maksimal 100 karakter."),
  lokasi: z
    .string()
    .min(1, "Lokasi wajib diisi.")
    .min(3, "Lokasi minimal 3 karakter.")
    .max(255, "Lokasi maksimal 255 karakter."),
  latitude: z
    .number()
    .min(-90, "Latitude tidak valid.")
    .max(90, "Latitude tidak valid."),
  longitude: z
    .number()
    .min(-180, "Longitude tidak valid.")
    .max(180, "Longitude tidak valid."),
  id_pop: z.number().int().positive("POP wajib dipilih."),
  ip_olt: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Format IP address tidak valid. Contoh: 192.168.1.1")
    .max(45, "IP address terlalu panjang.")
    .optional()
    .nullable(),
  username_olt: z
    .string()
    .min(1, "Username OLT wajib diisi.")
    .max(50, "Username maksimal 50 karakter.")
    .optional()
    .nullable(),
  password_olt: z
    .string()
    .min(1, "Password OLT wajib diisi.")
    .max(100, "Password maksimal 100 karakter.")
    .optional()
    .nullable(),
});

/**
 * ======================================
 * HELPER: Audit Log
 * ======================================
 */
async function logActivity(type: Prisma.ActivityLogCreateInput["type"], description: string) {
  const session = await auth();
  try {
    await prisma.activityLog.create({
      data: {
        type,
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
    throw new Error("Anda tidak memiliki akses untuk mengelola OLT.");
  }

  return session;
}

/**
 * ======================================
 * Simpan file foto OLT
 * ======================================
 */
const saveFotoOlt = async (file: File): Promise<string> => {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".jpg";
  const filename = `olt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  return `/uploads/olt/${filename}`;
};

/**
 * ======================================
 * Hapus file foto lama
 * ======================================
 */
const deleteFotoOlt = async (fotoPath: string | null) => {
  if (!fotoPath) return;
  try {
    const fullPath = path.join(process.cwd(), "public", fotoPath);
    await unlink(fullPath);
  } catch {
    // File tidak ada, abaikan
  }
};

/**
 * ======================================
 * Generate kode OLT otomatis
 * ======================================
 */
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

/**
 * ======================================
 * GET DATA
 * ======================================
 */
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

  // Convert Decimal to number — termasuk yang nested di dalam relasi `pop`
  const convertedData = data.map((o) => ({
    ...o,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    pop: o.pop
      ? {
          ...o.pop,
          latitude: Number(o.pop.latitude),
          longitude: Number(o.pop.longitude),
        }
      : null,
  }));

  return { data: convertedData, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

export const getPops = async () => {
  return prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true, alamat: true },
    orderBy: { nama_pop: "asc" },
  });
};

/**
 * ======================================
 * CREATE OLT
 * ======================================
 */
export const createOlt = async (formData: FormData) => {
  const session = await requireAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_olt: (formData.get("nama_olt") as string)?.trim() || "",
    lokasi: (formData.get("lokasi") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_pop: parseInt(formData.get("id_pop") as string, 10) || 0,
    ip_olt: (formData.get("ip_olt") as string)?.trim() || undefined,
    username_olt: (formData.get("username_olt") as string)?.trim() || undefined,
    password_olt: (formData.get("password_olt") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = oltValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  if (!validated.ip_olt || !validated.username_olt || !validated.password_olt) {
    throw new Error("IP Address, Username, dan Password wajib diisi.");
  }

  const fotoFile = formData.get("foto_olt") as File | null;

  if (!fotoFile || fotoFile.size === 0) {
    throw new Error("Foto OLT wajib diisi.");
  }

  const foto_olt = await saveFotoOlt(fotoFile);

  const kode_olt = await generateKodeOlt();

  await prisma.$transaction(async (tx) => {
    await tx.olt.create({
      data: {
        kode_olt,
        nama_olt: validated.nama_olt,
        lokasi: validated.lokasi,
        latitude: validated.latitude,
        longitude: validated.longitude,
        id_pop: validated.id_pop,
        ip_olt: validated.ip_olt || null,
        username_olt: validated.username_olt || null,
        password_olt: validated.password_olt || null,
        foto_olt,
      },
    });
  });

  await logActivity("OLT_CREATED", `OLT "${validated.nama_olt}" (${kode_olt}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/olt");
};

/**
 * ======================================
 * UPDATE OLT
 * ======================================
 */
export const updateOlt = async (id: number, formData: FormData) => {
  const session = await requireAccess();

  const existing = await prisma.olt.findUnique({ where: { id_olt: id } });
  if (!existing) {
    throw new Error("OLT tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_olt: (formData.get("nama_olt") as string)?.trim() || "",
    lokasi: (formData.get("lokasi") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_pop: parseInt(formData.get("id_pop") as string, 10) || 0,
    ip_olt: (formData.get("ip_olt") as string)?.trim() || undefined,
    username_olt: (formData.get("username_olt") as string)?.trim() || undefined,
    password_olt: (formData.get("password_olt") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = oltValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  if (!validated.ip_olt || !validated.username_olt || !validated.password_olt) {
    throw new Error("IP Address, Username, dan Password wajib diisi.");
  }

  const fotoFile = formData.get("foto_olt") as File | null;
  let foto_olt = existing.foto_olt;

  if (fotoFile && fotoFile.size > 0) {
    await deleteFotoOlt(existing.foto_olt);
    foto_olt = await saveFotoOlt(fotoFile);
  }

  if (!foto_olt) {
    throw new Error("Foto OLT wajib diisi.");
  }

  await prisma.olt.update({
    where: { id_olt: id },
    data: {
      nama_olt: validated.nama_olt,
      lokasi: validated.lokasi,
      latitude: validated.latitude,
      longitude: validated.longitude,
      id_pop: validated.id_pop,
      ip_olt: validated.ip_olt || null,
      username_olt: validated.username_olt || null,
      password_olt: validated.password_olt || null,
      foto_olt,
    },
  });

  await logActivity("OLT_UPDATED", `OLT "${validated.nama_olt}" (${existing.kode_olt}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/olt");
};

/**
 * ======================================
 * DELETE OLT
 * ======================================
 */
export const deleteOlt = async (id: number) => {
  const session = await requireAccess();

  const olt = await prisma.olt.findUnique({
    where: { id_olt: id },
    include: { _count: { select: { odp: true, baa: true } } },
  });

  if (!olt) {
    throw new Error("OLT tidak ditemukan.");
  }

  // Cek apakah OLT dipakai
  if (olt._count.odp > 0 || olt._count.baa > 0) {
    throw new Error(
      `OLT "${olt.nama_olt}" tidak bisa dihapus karena masih dipakai oleh ${olt._count.odp} ODP dan ${olt._count.baa} BAA.`
    );
  }

  await deleteFotoOlt(olt.foto_olt);
  await prisma.olt.delete({ where: { id_olt: id } });

  await logActivity("OLT_DELETED", `OLT "${olt.nama_olt}" (${olt.kode_olt}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/olt");
};