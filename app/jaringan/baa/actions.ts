"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma, ActivityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { optimizeImageToWebP } from "@/lib/image-utils";

/**
 * ======================================
 * HELPER: Simpan foto instalasi (WebP optimized)
 * ======================================
 */
async function saveFotoInstalasi(
  formData: FormData,
  existingPath: string | null
): Promise<string | null> {
  const file = formData.get("foto_instalasi") as File | null;

  if (file && file.size > 0) {
    return optimizeImageToWebP(file, "baa");
  }

  return existingPath;
}

/**
 * ======================================
 * HELPER: Audit Log
 * ======================================
 */
async function logActivity(type: ActivityType, description: string) {
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

/**
 * ======================================
 * HELPER: Validasi stok material cukup
 * ======================================
 */
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

/**
 * ======================================
 * HELPER: Validasi port ODP tersedia
 * ======================================
 */
async function validateOdpStock(id_odp: number) {
  const odp = await prisma.odp.findUnique({ where: { id_odp } });
  if (!odp) throw new Error("ODP tidak ditemukan");
  if (odp.stok_port !== null && odp.stok_port <= 0) {
    throw new Error(`Port ODP "${odp.nama_odp}" sudah habis (stok_port: ${odp.stok_port})`);
  }
}

/**
 * ======================================
 * HELPER: Validasi ONT belum dipakai BAA lain
 * ======================================
 * Satu ONT fisik cuma boleh terpasang di satu lokasi/pelanggan. Ini jaring
 * pengaman di server -- UI (dropdown ONT) sudah difilter cuma nampilkan yang
 * belum kepakai, tapi tetap perlu dicek ulang di sini untuk jaga-jaga race
 * condition (dua orang input barengan) atau request yang dikirim manual.
 * excludeBaaId dipakai pas mode edit, supaya BAA tidak dianggap "bentrok"
 * dengan ONT-nya sendiri.
 */
async function validateOntAvailability(id_ont: number, excludeBaaId?: number) {
  const existing = await prisma.baa.findFirst({
    where: {
      id_ont,
      ...(excludeBaaId ? { id_baa: { not: excludeBaaId } } : {}),
    },
    select: { id_baa: true, kode_baa: true },
  });

  if (existing) {
    throw new Error(
      `ONT ini sudah dipakai oleh BAA "${existing.kode_baa}". Pilih ONT lain yang masih tersedia.`
    );
  }
}

/**
 * ======================================
 * HELPER: Sesuaikan stok_port ODP
 * ======================================
 */
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

/**
 * ======================================
 * HELPER: Cek material dengan stok rendah
 * ======================================
 */
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

/**
 * ======================================
 * HELPER: Validasi izin Edit/Hapus BAA
 * ======================================
 */
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

  const isOwner = ownerId !== undefined && session.user.id_user === ownerId;
  if (!isAdminOrLeader && !isOwner) {
    throw new Error("Anda hanya bisa mengedit BAA yang Anda input sendiri.");
  }
}

/**
 * ======================================
 * 1. CREATE TEKNISI BARU
 * ======================================
 */
export async function createTeknisi(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const nama = (formData.get("nama_teknisi") as string)?.trim();
  const username = (formData.get("username_teknisi") as string)?.trim().toLowerCase();
  const email = (formData.get("email_teknisi") as string)?.trim();

  if (!nama || !username) {
    throw new Error("Nama dan Username wajib diisi");
  }

  // Cek duplikat username
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    throw new Error(`Username "${username}" sudah terdaftar. Gunakan username lain.`);
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

  await logActivity("USER_CREATED", `Teknisi "${nama}" (${username}) dibuat oleh ${session.user.nama}`);
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

/**
 * ======================================
 * 2. TAMBAH TEKNISI TAMBAHAN KE BAA
 * ======================================
 */
export async function addTeknisiTambahan(baaId: number, userId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Cek apakah sudah ada
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
        select: {
          id_user: true,
          nama: true,
          username: true,
        },
      },
    },
  });

  await logActivity("BAA_UPDATED", `Teknisi tambahan ditambahkan ke BAA #${baaId} oleh ${session.user.nama}`);
  revalidatePath("/jaringan/baa");
  return result;
}

/**
 * ======================================
 * 3. HAPUS TEKNISI TAMBAHAN
 * ======================================
 */
export async function removeTeknisiTambahan(id_baa_teknisi: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const baaTeknisi = await prisma.baateknisi.findUnique({
    where: { id_baa_teknisi },
    select: { id_baa: true },
  });

  await prisma.baateknisi.delete({
    where: { id_baa_teknisi },
  });

  await logActivity("BAA_UPDATED", `Teknisi tambahan dihapus dari BAA #${baaTeknisi?.id_baa} oleh ${session.user.nama}`);
  revalidatePath("/jaringan/baa");
}

/**
 * ======================================
 * 4. CREATE BAA - dengan audit log
 * ======================================
 */
export async function createBaa(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

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

  // Validasi stok SEBELUM ada perubahan
  await validateMaterialStock(details);
  await validateOdpStock(id_odp);
  await validateOntAvailability(id_ont);

  const foto_instalasi = await saveFotoInstalasi(formData, null);
  const kodeSementara = `TMP-${Date.now()}`;

  const newBaa = await prisma.$transaction(async (tx) => {
    // Update status ONT ke TERPASANG
    await tx.ont.update({
      where: { id_ont },
      data: { status: "TERPASANG" as const },
    });

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

    // Kurangi stok material
    for (const d of details) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { decrement: d.jumlah } },
      });
    }

    // Kurangi stok_port ODP
    await adjustOdpStokPort(tx, id_odp, -1);

    // Update status FAB ke AKTIF
    await tx.fab.update({
      where: { id_fab },
      data: { status: "AKTIF" },
    });

    return created;
  });

  // Tambah teknisi tambahan
  if (teknisiTambahanIds.length > 0) {
    await prisma.baateknisi.createMany({
      data: teknisiTambahanIds.map((id_user) => ({
        id_baa: newBaa.id_baa,
        id_user,
      })),
    });
  }

  await renumberKodeBaa();
  await logActivity("BAA_CREATED", `BAA #${newBaa.kode_baa} dibuat oleh ${session.user.nama}`);

  revalidatePath("/jaringan/baa");
  revalidatePath("/jaringan/fab");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");
  revalidatePath("/masterdata/ont");

  const lowStockMaterials = await getLowStockWarnings(details.map((d) => d.id_material));
  return { success: true, lowStockMaterials };
}

/**
 * ======================================
 * 5. UPDATE BAA - dengan audit log
 * ======================================
 */
export async function updateBaa(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const oldBaa = await prisma.baa.findUnique({
    where: { id_baa: id },
    include: { baadetail: true },
  });
  if (!oldBaa) throw new Error("BAA tidak ditemukan");

  await requireBaaAccess("edit", oldBaa.id_user);

  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
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

  // Stok yang akan "dikembalikan"
  const restoredStockMap = new Map<number, number>();
  for (const d of oldBaa.baadetail) {
    restoredStockMap.set(d.id_material, (restoredStockMap.get(d.id_material) ?? 0) + d.jumlah);
  }

  await validateMaterialStock(details, restoredStockMap);
  if (oldBaa.id_odp !== id_odp) {
    await validateOdpStock(id_odp);
  }
  // ONT cuma perlu dicek ulang kalau memang diganti -- kalau tetap pakai ONT
  // yang sama seperti sebelumnya, tidak perlu divalidasi lagi (dia sudah
  // "milik" BAA ini).
  if (oldBaa.id_ont !== id_ont) {
    await validateOntAvailability(id_ont, id);
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
        status: "SELESAI",
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

    // Kalau ODP berubah
    if (oldBaa.id_odp !== id_odp) {
      await adjustOdpStokPort(tx, oldBaa.id_odp, 1);
      await adjustOdpStokPort(tx, id_odp, -1);
    }

    // Tangani perubahan ONT
    if (oldBaa.id_ont !== id_ont) {
      if (oldBaa.id_ont !== null) {
        // ONT lama dikembalikan ke TERSEDIA
        await tx.ont.update({
          where: { id_ont: oldBaa.id_ont },
          data: { status: "TERSEDIA" as const },
        });
      }
      // ONT baru diset ke TERPASANG
      await tx.ont.update({
        where: { id_ont },
        data: { status: "TERPASANG" as const },
      });
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

  await logActivity("BAA_UPDATED", `BAA #${oldBaa.kode_baa} diupdate oleh ${session.user.nama}`);

  revalidatePath("/jaringan/baa");
  revalidatePath("/jaringan/fab");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");
  revalidatePath("/masterdata/ont");

  const lowStockMaterials = await getLowStockWarnings(details.map((d) => d.id_material));
  return { success: true, lowStockMaterials };
}

/**
 * ======================================
 * 6. DELETE BAA - dengan audit log
 * ======================================
 */
export async function deleteBaa(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  await requireBaaAccess("delete");

  const baa = await prisma.baa.findUnique({
    where: { id_baa: id },
    include: { baadetail: true },
  });
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

    // Kembalikan status ONT ke TERSEDIA (jika BAA memang punya ONT)
    if (baa.id_ont !== null) {
      await tx.ont.update({
        where: { id_ont: baa.id_ont },
        data: { status: "TERSEDIA" as const },
      });
    }

    await tx.baateknisi.deleteMany({ where: { id_baa: id } });
    await tx.baadetail.deleteMany({ where: { id_baa: id } });
    await tx.baa.delete({ where: { id_baa: id } });
  });

  await renumberKodeBaa();
  await logActivity("BAA_DELETED", `BAA #${baa.kode_baa} dihapus oleh ${session.user.nama}`);

  revalidatePath("/jaringan/baa");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");
  revalidatePath("/masterdata/ont");
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
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
    // Sama seperti di page.tsx BAA -- hanya ONT yang siap dipakai.
    where: {
      status: "TERSEDIA",
      baa: { none: {} },
    },
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
          penginput: true,
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