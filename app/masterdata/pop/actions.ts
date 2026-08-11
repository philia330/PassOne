"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { ActivityType } from "@prisma/client";
const PAGE_SIZE = 10;

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

  const nama_pop = (formData.get("nama_pop") as string)?.trim();
  const alamat = (formData.get("alamat") as string)?.trim();
  const id_area = parseInt(formData.get("id_area") as string, 10);
  const latitude = parseFloat(formData.get("latitude") as string) || 0;
  const longitude = parseFloat(formData.get("longitude") as string) || 0;

  if (!nama_pop || !alamat || isNaN(id_area)) {
    throw new Error("Nama POP, alamat, dan Area wajib diisi.");
  }

  const kode_pop = await generateKodePop();

  await prisma.$transaction(async (tx) => {
    await tx.pop.create({
      data: { kode_pop, nama_pop, alamat, id_area, latitude, longitude },
    });
  });

  await logActivity("POP_CREATED", `POP "${nama_pop}" (${kode_pop}) dibuat oleh ${session.user.nama}`);
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

  const nama_pop = (formData.get("nama_pop") as string)?.trim();
  const alamat = (formData.get("alamat") as string)?.trim();
  const id_area = parseInt(formData.get("id_area") as string, 10);
  const latitude = parseFloat(formData.get("latitude") as string) || 0;
  const longitude = parseFloat(formData.get("longitude") as string) || 0;

  if (!nama_pop || !alamat || isNaN(id_area)) {
    throw new Error("Nama POP, alamat, dan Area wajib diisi.");
  }

  await prisma.pop.update({
    where: { id_pop: id },
    data: { nama_pop, alamat, id_area, latitude, longitude },
  });

  await logActivity("POP_UPDATED", `POP "${nama_pop}" (${existing.kode_pop}) diupdate oleh ${session.user.nama}`);
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
