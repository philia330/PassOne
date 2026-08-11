"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ont_status } from "@prisma/client";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

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
  if (role !== Role.ADMIN && role !== Role.LOGISTIK) {
    throw new Error("Anda tidak memiliki akses untuk mengelola ONT.");
  }

  return session;
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
export const getOnts = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { serial_number: { contains: search } },
          { pelanggan: { contains: search } },
          { pop: { nama_pop: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.ont.findMany({
      where,
      // Batasi field relasi yang diambil -- pop & odp punya kolom Decimal
      // (latitude/longitude) yang tidak boleh dioper langsung ke Client
      // Component. Karena di sini cuma butuh nama-nya, select seperlunya saja.
      include: {
        pop: { select: { id_pop: true, nama_pop: true } },
        odp: { select: { id_odp: true, nama_odp: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ont.count({ where }),
  ]);

  return { data, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

export const getPops = async () => {
  return prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true },
    orderBy: { nama_pop: "asc" },
  });
};

export const getOdps = async () => {
  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

/**
 * ======================================
 * CREATE ONT
 * ======================================
 */
export const createOnt = async (formData: FormData) => {
  const session = await requireAccess();

  const serial_number = (formData.get("serial_number") as string)?.trim();
  const pelanggan = (formData.get("pelanggan") as string)?.trim();
  const rawStatus = formData.get("status") as string | null;
  const status = rawStatus === "TERPASANG" ? "TERSEDIA" : ((rawStatus as ont_status | null) || "TERSEDIA");
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  if (!serial_number || !pelanggan || isNaN(id_pop) || isNaN(id_odp)) {
    throw new Error("Serial number, pelanggan, POP, dan ODP wajib diisi.");
  }

  // Cek duplikat serial number
  const existing = await prisma.ont.findUnique({
    where: { serial_number },
  });

  if (existing) {
    throw new Error(`ONT dengan serial number "${serial_number}" sudah ada.`);
  }

  await prisma.$transaction(async (tx) => {
    // Double-check dalam transaction
    const existingInTx = await tx.ont.findUnique({ where: { serial_number } });
    if (existingInTx) {
      throw new Error(`ONT dengan serial number "${serial_number}" sudah ada.`);
    }

    await tx.ont.create({
      data: { serial_number, pelanggan, status: status || "TERSEDIA", id_pop, id_odp },
    });
  });

  await logActivity("ONT_CREATED", `ONT "${serial_number}" (${pelanggan}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};

/**
 * ======================================
 * UPDATE ONT
 * ======================================
 */
export const updateOnt = async (id: number, formData: FormData) => {
  const session = await requireAccess();

  const existing = await prisma.ont.findUnique({ where: { id_ont: id } });
  if (!existing) {
    throw new Error("ONT tidak ditemukan.");
  }

  const serial_number = (formData.get("serial_number") as string)?.trim();
  const pelanggan = (formData.get("pelanggan") as string)?.trim();
  const rawStatus = formData.get("status") as string | null;
  const status =
    rawStatus === "TERPASANG"
      ? existing.status
      : ((rawStatus as ont_status | null) || existing.status || "TERSEDIA");
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  if (!serial_number || !pelanggan || isNaN(id_pop) || isNaN(id_odp)) {
    throw new Error("Serial number, pelanggan, POP, dan ODP wajib diisi.");
  }

  // Cek duplikat jika serial berubah
  if (serial_number !== existing.serial_number) {
    const duplicate = await prisma.ont.findFirst({
      where: { serial_number, id_ont: { not: id } },
    });

    if (duplicate) {
      throw new Error(`ONT dengan serial number "${serial_number}" sudah ada.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (serial_number !== existing.serial_number) {
      const existingInTx = await tx.ont.findFirst({
        where: { serial_number, id_ont: { not: id } },
      });
      if (existingInTx) {
        throw new Error(`ONT dengan serial number "${serial_number}" sudah ada.`);
      }
    }

    await tx.ont.update({
      where: { id_ont: id },
      data: { serial_number, pelanggan, status: status || "TERSEDIA", id_pop, id_odp },
    });
  });

  await logActivity("ONT_UPDATED", `ONT "${serial_number}" (${pelanggan}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};

/**
 * ======================================
 * DELETE ONT
 * ======================================
 */
export const deleteOnt = async (id: number) => {
  const session = await requireAccess();

  const ont = await prisma.ont.findUnique({
    where: { id_ont: id },
    include: { _count: { select: { baa: true } } },
  });

  if (!ont) {
    throw new Error("ONT tidak ditemukan.");
  }

  // Cek apakah ONT dipakai di BAA
  if (ont._count.baa > 0) {
    throw new Error(
      `ONT "${ont.serial_number}" tidak bisa dihapus karena masih dipakai oleh ${ont._count.baa} BAA.`
    );
  }

  await prisma.ont.delete({ where: { id_ont: id } });

  await logActivity("ONT_DELETED", `ONT "${ont.serial_number}" (${ont.pelanggan}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};