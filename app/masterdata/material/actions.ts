"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { z } from "zod";

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
  if (role !== Role.ADMIN && role !== Role.LOGISTIK && role !== Role.TEKNISI) {
    throw new Error("Anda tidak memiliki akses untuk mengelola material.");
  }

  return session;
}

async function requireWriteAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const role = session.user.role;
  // Only ADMIN and LOGISTIK can create/update/delete material
  if (role !== Role.ADMIN && role !== Role.LOGISTIK) {
    throw new Error("Anda tidak memiliki akses untuk mengubah data material.");
  }

  return session;
}

// ======================================================
// VALIDATION SCHEMA - Material
// ======================================================

const materialValidation = z.object({
  nama_material: z
    .string()
    .min(1, "Nama material wajib diisi.")
    .min(2, "Nama material minimal 2 karakter.")
    .max(100, "Nama material maksimal 100 karakter."),
  stok: z
    .number()
    .int("Stok harus berupa angka bulat.")
    .min(0, "Stok tidak boleh kurang dari 0.")
    .max(999999, "Stok maksimal 999999."),
  minimal_stok: z
    .number()
    .int("Minimal stok harus berupa angka bulat.")
    .min(0, "Minimal stok tidak boleh kurang dari 0.")
    .max(999999, "Minimal stok maksimal 999999."),
  satuan: z
    .string()
    .min(1, "Satuan wajib diisi.")
    .max(20, "Satuan maksimal 20 karakter."),
  harga: z
    .number()
    .positive("Harga harus lebih dari 0.")
    .max(999999999999, "Harga terlalu besar."),
  kondisi: z.enum(["BAIK", "RUSAK"], {
    message: "Kondisi wajib dipilih.",
  }),
  keterangan: z
    .string()
    .max(500, "Keterangan maksimal 500 karakter.")
    .optional()
    .nullable(),
});

async function renumberKodeMaterial() {
  const semuaMaterial = await prisma.material.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_material: true },
  });

  await prisma.$transaction(
    semuaMaterial.map((item, i) =>
      prisma.material.update({
        where: { id_material: item.id_material },
        data: { kode_material: `MTR${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

/**
 * ======================================
 * HELPER: Kirim notifikasi stok kritis ke Admin/Leader/Logistik
 * Dipanggil setiap kali stok material diubah manual (create/update) dari
 * Master Data -- supaya tetap ada notifikasi walau stoknya tidak berubah
 * lewat pemakaian di BAA. TEKNISI sengaja TIDAK dikirimi notifikasi ini --
 * teknisi cuma perlu tau FAB yang ditugaskan ke mereka, bukan urusan stok.
 * ======================================
 */
async function notifyIfStockCritical(idMaterial: number) {
  const material = await prisma.material.findUnique({
    where: { id_material: idMaterial },
  });

  if (!material) return;
  if (material.stok > material.minimal_stok) return;

  const targets = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "LEADER", "LOGISTIK"] },
      status: true,
    },
    select: { id_user: true },
  });

  if (targets.length === 0) return;

  const notifications = targets.map((user) => ({
    id_user: user.id_user,
    title: "Stok Material Menipis",
    message: `${material.nama_material} tersisa ${material.stok} ${material.satuan} (minimal: ${material.minimal_stok}). Segera lakukan restok.`,
    link: `/masterdata/material`,
    type: "SYSTEM" as const,
    is_read: false,
  }));

  await prisma.notification.createMany({ data: notifications });
}

/**
 * ======================================
 * CREATE MATERIAL
 * ======================================
 */
export async function createMaterial(formData: FormData) {
  const session = await requireWriteAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_material: (formData.get("nama_material") as string)?.trim() || "",
    stok: parseFloat(formData.get("stok") as string) || 0,
    minimal_stok: parseFloat(formData.get("minimal_stok") as string) || 0,
    satuan: (formData.get("satuan") as string)?.trim() || "",
    harga: parseFloat(formData.get("harga") as string) || 0,
    kondisi: (formData.get("kondisi") as string) || "BAIK",
    keterangan: (formData.get("keterangan") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = materialValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Cek duplikat nama material
  const existing = await prisma.material.findFirst({
    where: {
      nama_material: {
        equals: validated.nama_material,
      },
    },
  });

  if (existing) {
    throw new Error(`Material "${validated.nama_material}" sudah ada. Gunakan nama yang berbeda.`);
  }

  const kodeSementara = `TMP-${Date.now()}`;

  const createdId = await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    const existingInTx = await tx.material.findFirst({
      where: {
        nama_material: {
          equals: validated.nama_material,
        },
      },
    });

    if (existingInTx) {
      throw new Error(`Material "${validated.nama_material}" sudah ada.`);
    }

    const created = await tx.material.create({
      data: {
        kode_material: kodeSementara,
        nama_material: validated.nama_material,
        stok: validated.stok,
        minimal_stok: validated.minimal_stok,
        satuan: validated.satuan,
        harga: validated.harga,
        kondisi: validated.kondisi,
        keterangan: validated.keterangan || null,
      },
    });

    return created.id_material;
  });

  await renumberKodeMaterial();
  await logActivity("MATERIAL_CREATED", `Material "${validated.nama_material}" dibuat oleh ${session.user.nama}`);

  // Cek langsung -- kalau stok awal material baru ini sudah di bawah/sama
  // dengan minimal stok, langsung kirim notifikasi kritis.
  await notifyIfStockCritical(createdId);

  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * UPDATE MATERIAL
 * ======================================
 */
export async function updateMaterial(id: number, formData: FormData) {
  const session = await requireWriteAccess();

  // Ambil data lama
  const existing = await prisma.material.findUnique({
    where: { id_material: id },
  });

  if (!existing) {
    throw new Error("Material tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_material: (formData.get("nama_material") as string)?.trim() || "",
    stok: parseFloat(formData.get("stok") as string) || 0,
    minimal_stok: parseFloat(formData.get("minimal_stok") as string) || 0,
    satuan: (formData.get("satuan") as string)?.trim() || "",
    harga: parseFloat(formData.get("harga") as string) || 0,
    kondisi: (formData.get("kondisi") as string) || "BAIK",
    keterangan: (formData.get("keterangan") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = materialValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Cek duplikat jika nama berubah
  if (validated.nama_material.toLowerCase() !== existing.nama_material.toLowerCase()) {
    const duplicate = await prisma.material.findFirst({
      where: {
        nama_material: {
          equals: validated.nama_material,
        },
        id_material: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(`Material "${validated.nama_material}" sudah ada.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    if (validated.nama_material.toLowerCase() !== existing.nama_material.toLowerCase()) {
      const existingInTx = await tx.material.findFirst({
        where: {
          nama_material: {
            equals: validated.nama_material,
          },
          id_material: { not: id },
        },
      });

      if (existingInTx) {
        throw new Error(`Material "${validated.nama_material}" sudah ada.`);
      }
    }

    await tx.material.update({
      where: { id_material: id },
      data: {
        nama_material: validated.nama_material,
        stok: validated.stok,
        minimal_stok: validated.minimal_stok,
        satuan: validated.satuan,
        harga: validated.harga,
        kondisi: validated.kondisi,
        keterangan: validated.keterangan || null,
      },
    });
  });

  await logActivity("MATERIAL_UPDATED", `Material "${validated.nama_material}" diupdate oleh ${session.user.nama}`);

  // Cek ulang setelah update -- stok/minimal_stok bisa saja baru berubah
  // jadi kritis (atau sebaliknya, sudah aman lagi) lewat form ini.
  await notifyIfStockCritical(id);

  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * DELETE MATERIAL
 * ======================================
 */
export async function deleteMaterial(id: number) {
  const session = await requireWriteAccess();

  // Ambil data sebelum hapus
  const material = await prisma.material.findUnique({
    where: { id_material: id },
  });

  if (!material) {
    throw new Error("Material tidak ditemukan.");
  }

  // Cek apakah material dipakai di baadetail
  const usedInBaa = await prisma.baadetail.count({
    where: { id_material: id },
  });

  if (usedInBaa > 0) {
    throw new Error(
      `Material "${material.nama_material}" tidak bisa dihapus karena dipakai di ${usedInBaa} data instalasi (BAA).`
    );
  }

  await prisma.material.delete({
    where: { id_material: id },
  });

  await renumberKodeMaterial();
  await logActivity("MATERIAL_DELETED", `Material "${material.nama_material}" dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
export async function getMaterialTotal() {
  return prisma.material.count();
}

/**
 * ======================================
 * GET BAA USAGE FOR A MATERIAL
 * ======================================
 */
export async function getMaterialBaaUsage(id_material: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Ambil semua detail BAA yang menggunakan material ini
  const baaDetails = await prisma.baadetail.findMany({
    where: { id_material },
    include: {
      baa: {
        include: {
          fab: {
            select: {
              nama_pelanggan: true,
            },
          },
          users: {
            select: {
              nama: true,
            },
          },
        },
      },
    },
    orderBy: {
      baa: {
        tanggal_instalasi: "desc",
      },
    },
  });

  // Format data penggunaan
  const usageData = baaDetails.map((detail) => ({
    id_baa: detail.baa.id_baa,
    kode_baa: detail.baa.kode_baa,
    tanggal_instalasi: detail.baa.tanggal_instalasi,
    nama_pelanggan: detail.baa.fab.nama_pelanggan,
    jumlah: detail.jumlah,
    keterangan: detail.keterangan,
    teknisi_utama: detail.baa.users.nama,
  }));

  // Total jumlah yang digunakan
  const totalDigunakan = usageData.reduce((sum, item) => sum + item.jumlah, 0);

  return {
    usageData,
    totalDigunakan,
  };
}

export async function getMaterials(search: string, page: number) {
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { nama_material: { contains: search, mode: "insensitive" as const } },
          { kode_material: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rawMaterial, total] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.material.count({ where }),
  ]);

  const data = rawMaterial.map((item) => ({
    ...item,
    harga: Number(item.harga),
  }));

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}