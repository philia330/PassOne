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
    throw new Error("Anda tidak memiliki akses untuk mengelola material.");
  }

  return session;
}

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
 * CREATE MATERIAL
 * ======================================
 */
export async function createMaterial(formData: FormData) {
  const session = await requireAccess();

  const nama_material = (formData.get("nama_material") as string)?.trim();
  const stok = Number(formData.get("stok"));
  const minimal_stok = Number(formData.get("minimal_stok"));
  const satuan = (formData.get("satuan") as string)?.trim();
  const harga = Number(formData.get("harga"));
  const kondisi = formData.get("kondisi") as "BAIK" | "RUSAK";
  const keterangan = (formData.get("keterangan") as string)?.trim();

  if (!nama_material || !satuan || isNaN(harga) || harga <= 0) {
    throw new Error("Nama material, satuan, dan harga wajib diisi dengan benar.");
  }

  // Cek duplikat nama material
  const existing = await prisma.material.findFirst({
    where: {
      nama_material: {
        equals: nama_material,
        
      },
    },
  });

  if (existing) {
    throw new Error(`Material "${nama_material}" sudah ada. Gunakan nama yang berbeda.`);
  }

  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    const existingInTx = await tx.material.findFirst({
      where: {
        nama_material: {
          equals: nama_material,
          
        },
      },
    });

    if (existingInTx) {
      throw new Error(`Material "${nama_material}" sudah ada.`);
    }

    await tx.material.create({
      data: {
        kode_material: kodeSementara,
        nama_material,
        stok: isNaN(stok) ? 0 : stok,
        minimal_stok: isNaN(minimal_stok) ? 0 : minimal_stok,
        satuan,
        harga,
        kondisi: kondisi || "BAIK",
        keterangan: keterangan || null,
      },
    });
  });

  await renumberKodeMaterial();
  await logActivity("MATERIAL_CREATED", `Material "${nama_material}" dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * UPDATE MATERIAL
 * ======================================
 */
export async function updateMaterial(id: number, formData: FormData) {
  const session = await requireAccess();

  // Ambil data lama
  const existing = await prisma.material.findUnique({
    where: { id_material: id },
  });

  if (!existing) {
    throw new Error("Material tidak ditemukan.");
  }

  const nama_material = (formData.get("nama_material") as string)?.trim();
  const stok = Number(formData.get("stok"));
  const minimal_stok = Number(formData.get("minimal_stok"));
  const satuan = (formData.get("satuan") as string)?.trim();
  const harga = Number(formData.get("harga"));
  const kondisi = formData.get("kondisi") as "BAIK" | "RUSAK";
  const keterangan = (formData.get("keterangan") as string)?.trim();

  if (!nama_material || !satuan || isNaN(harga) || harga <= 0) {
    throw new Error("Nama material, satuan, dan harga wajib diisi dengan benar.");
  }

  // Cek duplikat jika nama berubah
  if (nama_material.toLowerCase() !== existing.nama_material.toLowerCase()) {
    const duplicate = await prisma.material.findFirst({
      where: {
        nama_material: {
          equals: nama_material,
          
        },
        id_material: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(`Material "${nama_material}" sudah ada.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Double-check di dalam transaction
    if (nama_material.toLowerCase() !== existing.nama_material.toLowerCase()) {
      const existingInTx = await tx.material.findFirst({
        where: {
          nama_material: {
            equals: nama_material,
            
          },
          id_material: { not: id },
        },
      });

      if (existingInTx) {
        throw new Error(`Material "${nama_material}" sudah ada.`);
      }
    }

    await tx.material.update({
      where: { id_material: id },
      data: {
        nama_material,
        stok: isNaN(stok) ? 0 : stok,
        minimal_stok: isNaN(minimal_stok) ? 0 : minimal_stok,
        satuan,
        harga,
        kondisi: kondisi || "BAIK",
        keterangan: keterangan || null,
      },
    });
  });

  await logActivity("MATERIAL_UPDATED", `Material "${nama_material}" diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * DELETE MATERIAL
 * ======================================
 */
export async function deleteMaterial(id: number) {
  const session = await requireAccess();

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
