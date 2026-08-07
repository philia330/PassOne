"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

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
    throw new Error("Anda tidak memiliki akses untuk mengelola paket.");
  }

  return session;
}

async function renumberKodePaket() {
  const semuaPaket = await prisma.paket.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_paket: true },
  });

  await prisma.$transaction(
    semuaPaket.map((item, i) =>
      prisma.paket.update({
        where: { id_paket: item.id_paket },
        data: { kode_paket: `PKT${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

/**
 * ======================================
 * CREATE PAKET
 * ======================================
 */
export async function createPaket(formData: FormData) {
  const session = await requireAccess();

  const nama_paket = (formData.get("nama_paket") as string)?.trim();
  const kecepatan = (formData.get("kecepatan") as string)?.trim();
  const harga = Number(formData.get("harga"));
  const keterangan = (formData.get("keterangan") as string)?.trim();

  if (!nama_paket || !kecepatan || isNaN(harga) || harga <= 0) {
    throw new Error("Nama paket, kecepatan, dan harga wajib diisi dengan benar.");
  }

  // Cek duplikat nama paket
  const existing = await prisma.paket.findFirst({
    where: {
      nama_paket: {
        equals: nama_paket,
        
      },
    },
  });

  if (existing) {
    throw new Error(`Paket "${nama_paket}" sudah ada. Gunakan nama yang berbeda.`);
  }

  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    const existingInTx = await tx.paket.findFirst({
      where: {
        nama_paket: {
          equals: nama_paket,
          
        },
      },
    });

    if (existingInTx) {
      throw new Error(`Paket "${nama_paket}" sudah ada.`);
    }

    await tx.paket.create({
      data: {
        kode_paket: kodeSementara,
        nama_paket,
        kecepatan,
        harga,
        keterangan: keterangan || null,
      },
    });
  });

  await renumberKodePaket();
  await logActivity("PAKET_CREATED", `Paket "${nama_paket}" (${kecepatan}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/paket");
}

/**
 * ======================================
 * UPDATE PAKET
 * ======================================
 */
export async function updatePaket(id: number, formData: FormData) {
  const session = await requireAccess();

  // Ambil data lama
  const existing = await prisma.paket.findUnique({
    where: { id_paket: id },
  });

  if (!existing) {
    throw new Error("Paket tidak ditemukan.");
  }

  const nama_paket = (formData.get("nama_paket") as string)?.trim();
  const kecepatan = (formData.get("kecepatan") as string)?.trim();
  const harga = Number(formData.get("harga"));
  const keterangan = (formData.get("keterangan") as string)?.trim();

  if (!nama_paket || !kecepatan || isNaN(harga) || harga <= 0) {
    throw new Error("Nama paket, kecepatan, dan harga wajib diisi dengan benar.");
  }

  // Cek duplikat jika nama berubah
  if (nama_paket.toLowerCase() !== existing.nama_paket.toLowerCase()) {
    const duplicate = await prisma.paket.findFirst({
      where: {
        nama_paket: {
          equals: nama_paket,
          
        },
        id_paket: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(`Paket "${nama_paket}" sudah ada.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    if (nama_paket.toLowerCase() !== existing.nama_paket.toLowerCase()) {
      const existingInTx = await tx.paket.findFirst({
        where: {
          nama_paket: {
            equals: nama_paket,
            
          },
          id_paket: { not: id },
        },
      });

      if (existingInTx) {
        throw new Error(`Paket "${nama_paket}" sudah ada.`);
      }
    }

    await tx.paket.update({
      where: { id_paket: id },
      data: {
        nama_paket,
        kecepatan,
        harga,
        keterangan: keterangan || null,
      },
    });
  });

  await logActivity("PAKET_UPDATED", `Paket "${nama_paket}" diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/paket");
}

/**
 * ======================================
 * DELETE PAKET
 * ======================================
 */
export async function deletePaket(id: number) {
  const session = await requireAccess();

  // Ambil data sebelum hapus
  const paket = await prisma.paket.findUnique({
    where: { id_paket: id },
  });

  if (!paket) {
    throw new Error("Paket tidak ditemukan.");
  }

  // Cek apakah paket dipakai di FAB
  const usedInFab = await prisma.fab.count({
    where: { id_paket: id },
  });

  if (usedInFab > 0) {
    throw new Error(
      `Paket "${paket.nama_paket}" tidak bisa dihapus karena dipakai oleh ${usedInFab} pelanggan (FAB).`
    );
  }

  await prisma.paket.delete({
    where: { id_paket: id },
  });

  await renumberKodePaket();
  await logActivity("PAKET_DELETED", `Paket "${paket.nama_paket}" dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/paket");
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
export async function getPaketTotal() {
  return prisma.paket.count();
}

export async function getPakets(search: string, page: number) {
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { nama_paket: { contains: search, mode: "insensitive" as const } },
          { kode_paket: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rawPaket, total] = await Promise.all([
    prisma.paket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.paket.count({ where }),
  ]);

  const data = rawPaket.map((item) => ({
    ...item,
    harga: Number(item.harga),
  }));

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
