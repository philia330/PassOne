"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

/**
 * ======================================
 * HELPER: Simpan foto instalasi
 * ======================================
 */
async function saveFotoInstalasi(
  formData: FormData,
  existingPath: string | null
): Promise<string | null> {
  const file = formData.get("foto_instalasi") as File | null;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "baa");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `baa-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    return `/uploads/baa/${filename}`;
  }

  return existingPath;
}

/**
 * ======================================
 * HELPER: Rapikan ulang kode_baa
 * ======================================
 */
async function renumberKodeBaa() {
  const semuaBaa = await prisma.baa.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_baa: true },
  });

  await prisma.$transaction(
    semuaBaa.map((item, i) =>
      prisma.baa.update({
        where: { id_baa: item.id_baa },
        data: { kode_baa: `BAA${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

function toOptionalNumber(
  value: FormDataEntryValue | null,
  minValue = 0,
  maxValue = 9999
): number | null {
  if (value === null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (num < minValue || num > maxValue) {
    throw new Error(`Nilai ${num} tidak valid. Harus di antara ${minValue} sampai ${maxValue}.`);
  }
  return num;
}

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (value === null || value === "") return null;
  return value as string;
}

interface ParsedDetail {
  id_material: number;
  jumlah: number;
  keterangan: string | null;
}

function parseBaaDetails(raw: string | null): ParsedDetail[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as {
      id_material: string;
      jumlah: string;
      keterangan: string;
    }[];

    return arr
      .filter((d) => d.id_material && d.jumlah)
      .map((d) => ({
        id_material: Number(d.id_material),
        jumlah: Number(d.jumlah),
        keterangan: d.keterangan || null,
      }));
  } catch {
    return [];
  }
}


// ================================================================
// HELPER: Validasi stok material cukup atau tidak
// ================================================================
async function validateMaterialStock(details: ParsedDetail[], restoredStockMap?: Map<number, number>) {
  if (details.length === 0) return;

  const materialIds = details.map((d) => d.id_material);
  const materials = await prisma.material.findMany({
    where: { id_material: { in: materialIds } },
  });

  const insufficient: string[] = [];
  for (const detail of details) {
    const material = materials.find((m) => m.id_material === detail.id_material);
    if (!material) {
      insufficient.push(`Material ID ${detail.id_material} tidak ditemukan`);
      continue;
    }
    const bonus = restoredStockMap?.get(detail.id_material) ?? 0;
    const effectiveStok = material.stok + bonus;
    if (effectiveStok < detail.jumlah) {
      insufficient.push(
        `${material.nama_material}: stok tersedia ${effectiveStok} ${material.satuan}, diminta ${detail.jumlah} ${material.satuan}`
      );
    }
  }

  if (insufficient.length > 0) {
    throw new Error(`Stok material tidak cukup:\n${insufficient.join("\n")}`);
  }
}

// ================================================================
// HELPER: Validasi port ODP tersedia
// ================================================================
async function validateOdpStock(id_odp: number) {
  const odp = await prisma.odp.findUnique({ where: { id_odp } });
  if (!odp) throw new Error("ODP tidak ditemukan");
  if (odp.stok_port !== null && odp.stok_port <= 0) {
    throw new Error(`Port ODP "${odp.nama_odp}" sudah habis (stok_port: ${odp.stok_port})`);
  }
}

// ================================================================
// HELPER: Sesuaikan stok_port ODP (aman untuk field nullable)
// ================================================================
async function adjustOdpStokPort(
  tx: Prisma.TransactionClient,
  id_odp: number,
  delta: number
) {
  const odp = await tx.odp.findUnique({ where: { id_odp }, select: { stok_port: true } });
  if (odp && odp.stok_port !== null) {
    await tx.odp.update({
      where: { id_odp },
      data: { stok_port: { increment: delta } },
    });
  }
}

// ================================================================
// HELPER: Cek material mana yang stoknya sudah di bawah minimal
// ================================================================
async function getLowStockWarnings(materialIds: number[]): Promise<string[]> {
  if (materialIds.length === 0) return [];
  const uniqueIds = [...new Set(materialIds)];
  const materials = await prisma.material.findMany({
    where: { id_material: { in: uniqueIds } },
  });
  return materials
    .filter((m) => m.stok <= m.minimal_stok)
    .map((m) => `${m.nama_material} tersisa ${m.stok} ${m.satuan} (minimal: ${m.minimal_stok})`);
}

// ================================================================
// HELPER: Validasi izin Edit/Hapus BAA
// ================================================================
async function requireBaaAccess(action: "edit" | "delete", ownerId?: number) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Anda harus login untuk melakukan aksi ini.");
  }

  const role = session.user.role;
const isAdminOrLeader = role === Role.ADMIN || role === Role.LEADER;

  if (action === "delete") {
    if (!isAdminOrLeader) {
      throw new Error("Hanya Admin atau Leader yang bisa menghapus BAA.");
    }
    return;
  }

  // action === "edit"
  const isOwner = ownerId !== undefined && session.user.id_user === ownerId;
  if (!isAdminOrLeader && !isOwner) {
    throw new Error("Anda hanya bisa mengedit BAA yang Anda input sendiri.");
  }
}

// ================================================================
// 1. CREATE TEKNISI BARU (dari form BAA)
// ================================================================
export async function createTeknisi(formData: FormData) {
  const nama = formData.get("nama_teknisi") as string;
  const username = formData.get("username_teknisi") as string;
  const email = formData.get("email_teknisi") as string;

  if (!nama || !username) {
    throw new Error("Nama dan Username wajib diisi");
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    throw new Error(`Username "${username}" sudah terdaftar`);
  }

  const lastUser = await prisma.user.findFirst({
    orderBy: { id_user: "desc" },
    select: { kode_user: true },
  });

  let nextNumber = 1;
  if (lastUser?.kode_user) {
    const match = lastUser.kode_user.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }
  const kodeUser = `USR${String(nextNumber).padStart(3, "0")}`;

  const hashedPassword = await bcrypt.hash(`${username}123`, 10);

  const newUser = await prisma.user.create({
    data: {
      kode_user: kodeUser,
      nama,
      username,
      email: email || `${username}@passnet.id`,
      password: hashedPassword,
      jkl: "LAKI_LAKI",
      role: "TEKNISI",
      status: true,
    },
  });

  revalidatePath("/jaringan/baa");

  return {
    success: true,
    data: {
      id_user: newUser.id_user,
      kode_user: newUser.kode_user,
      nama: newUser.nama,
      username: newUser.username,
      email: newUser.email,
      defaultPassword: `${username}123`,
    },
  };
}

// ================================================================
// 2. TAMBAH TEKNISI TAMBAHAN KE BAA
// ================================================================
export async function addTeknisiTambahan(baaId: number, userId: number) {
  // Cek apakah sudah ada - pakai baateknisi (huruf kecil semua)
  const existing = await prisma.baateknisi.findUnique({
    where: {
      id_baa_id_user: {
        id_baa: baaId,
        id_user: userId,
      },
    },
  });

  if (existing) {
    throw new Error("Teknisi ini sudah ditambahkan ke BAA ini");
  }

  // Cek apakah teknisi adalah teknisi utama
  const baa = await prisma.baa.findUnique({
    where: { id_baa: baaId },
    select: { id_user: true },
  });

  if (baa?.id_user === userId) {
    throw new Error("Teknisi ini adalah teknisi utama");
  }

  const result = await prisma.baateknisi.create({
    data: {
      id_baa: baaId,
      id_user: userId,
    },
    include: {
      users: {
        // relasi ke User pakai users
        select: {
          id_user: true,
          nama: true,
          username: true,
        },
      },
    },
  });

  revalidatePath(`/jaringan/baateknisi/${baaId}`);
  revalidatePath("/jaringan/baa");
  return result;
}

// ================================================================
// 3. HAPUS TEKNISI TAMBAHAN DARI BAA
// ================================================================
export async function removeTeknisiTambahan(id_baa_teknisi: number) {
  const baaTeknisi = await prisma.baateknisi.findUnique({
    where: { id_baa_teknisi },
    select: { id_baa: true },
  });

  await prisma.baateknisi.delete({
    where: { id_baa_teknisi },
  });

  if (baaTeknisi) {
    revalidatePath(`/jaringan/baateknisi/${baaTeknisi.id_baa}`);
  }
  revalidatePath("/jaringan/baa");
}

// ================================================================
// 4. CREATE BAA
// ================================================================
export async function createBaa(formData: FormData) {
  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
  const status = "SELESAI" as const;
  const id_fab = Number(formData.get("id_fab"));
  const id_user = Number(formData.get("id_user"));
  const id_olt = Number(formData.get("id_olt"));
  const id_odp = Number(formData.get("id_odp"));
  const id_ont = Number(formData.get("id_ont"));

  const teknisiTambahanRaw = formData.get("teknisi_tambahan") as string | null;
  const teknisiTambahanIds: number[] = teknisiTambahanRaw ? JSON.parse(teknisiTambahanRaw) : [];

  if (!tanggal_instalasi || !id_fab || !id_user || !id_olt || !id_odp || !id_ont) {
    throw new Error("Tanggal instalasi, FAB, Teknisi Utama, OLT, ODP, dan ONT wajib diisi.");
  }

  const details = parseBaaDetails(formData.get("baa_details") as string | null);

  // Validasi stok SEBELUM ada perubahan apapun di database
  await validateMaterialStock(details);
  await validateOdpStock(id_odp);

  const foto_instalasi = await saveFotoInstalasi(formData, null);
  const kodeSementara = `TMP-${Date.now()}`;

  const newBaa = await prisma.$transaction(async (tx) => {
    const created = await tx.baa.create({
      data: {
        kode_baa: kodeSementara,
        tanggal_instalasi: new Date(tanggal_instalasi),
        status,
        id_fab,
        id_user,
        id_olt,
        id_odp,
        id_ont,
port_olt: toOptionalNumber(formData.get("port_olt"), 0, 9999),
port_odp: toOptionalNumber(formData.get("port_odp"), 0, 9999),
rx_power_dbm: toOptionalNumber(formData.get("rx_power_dbm"), -60, 10),
tx_power_dbm: toOptionalNumber(formData.get("tx_power_dbm"), -10, 20),
        speed_download: toOptionalString(formData.get("speed_download")),
        speed_upload: toOptionalString(formData.get("speed_upload")),
ping_ms: toOptionalNumber(formData.get("ping_ms"), 0, 10000),
        catatan: toOptionalString(formData.get("catatan")),
        foto_instalasi,
        baadetail: {
          create: details.map((d) => ({
            id_material: d.id_material,
            jumlah: d.jumlah,
            keterangan: d.keterangan,
          })),
        },
      },
    });

    // Kurangi stok material sesuai pemakaian
    for (const d of details) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { decrement: d.jumlah } },
      });
    }

    // Kurangi stok_port ODP (1 instalasi = 1 port terpakai)
    await adjustOdpStokPort(tx, id_odp, -1);

    await tx.fab.update({
      where: { id_fab },
      data: { status: "AKTIF" },
    });

    return created;
  });

  if (teknisiTambahanIds.length > 0) {
    await prisma.baateknisi.createMany({
      data: teknisiTambahanIds.map((id_user) => ({
        id_baa: newBaa.id_baa,
        id_user,
      })),
    });
  }

  await renumberKodeBaa();
  revalidatePath("/jaringan/baa");
  revalidatePath("/jaringan/fab");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");

  const lowStockMaterials = await getLowStockWarnings(details.map((d) => d.id_material));
  return { success: true, lowStockMaterials };
}

// ================================================================
// 5. UPDATE BAA
// ================================================================
export async function updateBaa(id: number, formData: FormData) {
  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
  const status = "SELESAI" as const;
  const id_fab = Number(formData.get("id_fab"));
  const id_user = Number(formData.get("id_user"));
  const id_olt = Number(formData.get("id_olt"));
  const id_odp = Number(formData.get("id_odp"));
  const id_ont = Number(formData.get("id_ont"));

  const teknisiTambahanRaw = formData.get("teknisi_tambahan") as string | null;
  const teknisiTambahanIds: number[] = teknisiTambahanRaw ? JSON.parse(teknisiTambahanRaw) : [];

  if (!tanggal_instalasi || !id_fab || !id_user || !id_olt || !id_odp || !id_ont) {
    throw new Error("Tanggal instalasi, FAB, Teknisi Utama, OLT, ODP, dan ONT wajib diisi.");
  }

  const details = parseBaaDetails(formData.get("baa_details") as string | null);
  const existingFoto = (formData.get("foto_instalasi_existing") as string | null) || null;
  const foto_instalasi = await saveFotoInstalasi(formData, existingFoto);

  const oldBaa = await prisma.baa.findUnique({
    where: { id_baa: id },
    include: { baadetail: true },
  });
  if (!oldBaa) throw new Error("BAA tidak ditemukan");

  await requireBaaAccess("edit", oldBaa.id_user);

  // Stok yang akan "dikembalikan" dari pemakaian lama, dipakai buat validasi
  const restoredStockMap = new Map<number, number>();
  for (const d of oldBaa.baadetail) {
    restoredStockMap.set(d.id_material, (restoredStockMap.get(d.id_material) ?? 0) + d.jumlah);
  }

  await validateMaterialStock(details, restoredStockMap);
  if (oldBaa.id_odp !== id_odp) {
    await validateOdpStock(id_odp);
  }

  await prisma.$transaction(async (tx) => {
    // Kembalikan stok material lama
    for (const d of oldBaa.baadetail) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { increment: d.jumlah } },
      });
    }

    await tx.baateknisi.deleteMany({ where: { id_baa: id } });
    await tx.baadetail.deleteMany({ where: { id_baa: id } });

    await tx.baa.update({
      where: { id_baa: id },
      data: {
        tanggal_instalasi: new Date(tanggal_instalasi),
        status,
        id_fab,
        id_user,
        id_olt,
        id_odp,
        id_ont,
port_olt: toOptionalNumber(formData.get("port_olt"), 0, 9999),
port_odp: toOptionalNumber(formData.get("port_odp"), 0, 9999),
rx_power_dbm: toOptionalNumber(formData.get("rx_power_dbm"), -60, 10),
tx_power_dbm: toOptionalNumber(formData.get("tx_power_dbm"), -10, 20),
        speed_download: toOptionalString(formData.get("speed_download")),
        speed_upload: toOptionalString(formData.get("speed_upload")),
ping_ms: toOptionalNumber(formData.get("ping_ms"), 0, 10000),
        catatan: toOptionalString(formData.get("catatan")),
        foto_instalasi,
        baadetail: {
          create: details.map((d) => ({
            id_material: d.id_material,
            jumlah: d.jumlah,
            keterangan: d.keterangan,
          })),
        },
      },
    });

    // Kurangi stok material sesuai data baru
    for (const d of details) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { decrement: d.jumlah } },
      });
    }

    // Kalau ODP berubah, kembalikan port lama & kurangi port baru
    if (oldBaa.id_odp !== id_odp) {
      await adjustOdpStokPort(tx, oldBaa.id_odp, 1);
      await adjustOdpStokPort(tx, id_odp, -1);
    }

    await tx.fab.update({
      where: { id_fab },
      data: { status: "AKTIF" },
    });
  });

  if (teknisiTambahanIds.length > 0) {
    await prisma.baateknisi.createMany({
      data: teknisiTambahanIds.map((id_user) => ({
        id_baa: id,
        id_user,
      })),
    });
  }

  revalidatePath("/jaringan/baa");
  revalidatePath("/jaringan/fab");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");

  const lowStockMaterials = await getLowStockWarnings(details.map((d) => d.id_material));
  return { success: true, lowStockMaterials };
}

// ================================================================
// 6. DELETE BAA
// ================================================================
export async function deleteBaa(id: number) {
  await requireBaaAccess("delete");

  const baa = await prisma.baa.findUnique({
    where: { id_baa: id },
    include: { baadetail: true },
  });
  // ...sisanya tetap sama
  if (!baa) throw new Error("BAA tidak ditemukan");

  await prisma.$transaction(async (tx) => {
    // Kembalikan stok material
    for (const d of baa.baadetail) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { increment: d.jumlah } },
      });
    }

    // Kembalikan stok_port ODP
    await adjustOdpStokPort(tx, baa.id_odp, 1);

    await tx.baateknisi.deleteMany({ where: { id_baa: id } });
    await tx.baadetail.deleteMany({ where: { id_baa: id } });
    await tx.baa.delete({ where: { id_baa: id } });
  });

  await renumberKodeBaa();
  revalidatePath("/jaringan/baa");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");
}
// ================================================================
// 7. GET TEKNISI TAMBAHAN
// ================================================================
export async function getTeknisiTambahan(baaId: number) {
  return await prisma.baateknisi.findMany({
    where: { id_baa: baaId },
    include: {
      users: {
        // relasi ke User pakai users
        select: {
          id_user: true,
          nama: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
// ================================================================
// 8. GET DATA UNTUK TABEL (TAMBAHAN BARU)
// ================================================================

export async function getBaaData() {
  return await prisma.baa.findMany({
    include: {
      fab: true,
      users: true,
      olt: true,
      odp: true,
      ont: true,
      baadetail: true,
      teknisiTambahan: {
        include: {
          users: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFabOptions() {
  return await prisma.fab.findMany({
    where: { status: "OPEN" },
    orderBy: { kode_fab: "asc" },
  });
}

export async function getTeknisiOptions() {
  return await prisma.user.findMany({
    where: { role: "TEKNISI" },
    orderBy: { nama: "asc" },
  });
}

export async function getOltOptions() {
  return await prisma.olt.findMany({
    orderBy: { nama_olt: "asc" },
  });
}

export async function getOdpOptions() {
  return await prisma.odp.findMany({
    orderBy: { nama_odp: "asc" },
  });
}

export async function getOntOptions() {
  return await prisma.ont.findMany({
    orderBy: { serial_number: "asc" },
  });
}

export async function getMaterialOptions() {
  return await prisma.material.findMany({
    orderBy: { nama_material: "asc" },
  });
}

export async function getBaaById(id: number) {
  return await prisma.baa.findUnique({
    where: { id_baa: id },
    include: {
      fab: {
        include: {
          area: true,
          paket: true,
          users: true,
        },
      },
      users: true,
      olt: true,
      odp: true,
      ont: true,
      baadetail: {
        include: {
          material: true,
        },
      },
      teknisiTambahan: {
        include: {
          users: true,
        },
      },
    },
  });
}