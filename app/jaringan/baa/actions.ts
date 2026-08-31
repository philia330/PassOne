"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma, ActivityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { optimizeImageToWebP } from "@/lib/image-utils";
import { z } from "zod";

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

// ======================================================
// VALIDATION SCHEMAS - BAA
// ======================================================

const baaDetailValidation = z.object({
  id_material: z.number().int().positive("Material wajib dipilih."),
  jumlah: z
    .number()
    .int("Jumlah harus berupa angka bulat.")
    .min(1, "Jumlah minimal 1."),
  keterangan: z.string().max(255).nullable().optional(),
});

const baaValidation = z.object({
  tanggal_instalasi: z.string().min(1, "Tanggal instalasi wajib diisi."),
  id_fab: z.number().int().positive("FAB wajib dipilih."),
  id_user: z.number().int().positive("Teknisi utama wajib dipilih."),
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
  id_ont: z.number().int().positive("ONT wajib dipilih."),
  port_olt: z
    .number()
    .int("Port OLT harus berupa angka bulat.")
    .min(0, "Port OLT tidak boleh kurang dari 0.")
    .max(9999, "Port OLT maksimal 9999.")
    .nullable()
    .optional(),
  port_odp: z
    .number()
    .int("Port ODP harus berupa angka bulat.")
    .min(0, "Port ODP tidak boleh kurang dari 0.")
    .max(9999, "Port ODP maksimal 9999.")
    .nullable()
    .optional(),
  rx_power_dbm: z
    .number()
    .min(-60, "RX Power minimal -60 dBm.")
    .max(10, "RX Power maksimal 10 dBm.")
    .nullable()
    .optional(),
  tx_power_dbm: z
    .number()
    .min(-10, "TX Power minimal -10 dBm.")
    .max(20, "TX Power maksimal 20 dBm.")
    .nullable()
    .optional(),
  speed_download: z.string().max(20, "Kecepatan maksimal 20 karakter.").nullable().optional(),
  speed_upload: z.string().max(20, "Kecepatan maksimal 20 karakter.").nullable().optional(),
  ping_ms: z
    .number()
    .int("Ping harus berupa angka bulat.")
    .min(0, "Ping tidak boleh kurang dari 0.")
    .max(10000, "Ping maksimal 10000 ms.")
    .nullable()
    .optional(),
  catatan: z.string().max(1000, "Catatan maksimal 1000 karakter.").nullable().optional(),
  baa_details: z.array(baaDetailValidation).min(1, "Minimal harus ada 1 material."),
  teknisi_tambahan: z.array(z.number()).optional(),
});

const teknisiValidation = z.object({
  nama_teknisi: z
    .string()
    .min(1, "Nama teknisi wajib diisi.")
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  username_teknisi: z
    .string()
    .min(1, "Username wajib diisi.")
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore.")
    .toLowerCase(),
  email_teknisi: z
    .string()
    .email("Format email tidak valid.")
    .max(254, "Email maksimal 254 karakter.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/**
 * ======================================
 * HELPER: Konversi FormDataEntryValue ke number untuk keperluan VALIDASI ZOD
 * ======================================
 * formData.get() SELALU mengembalikan string (atau File/null), padahal
 * schema Zod untuk field seperti port_olt, rx_power_dbm, dll didefinisikan
 * sebagai z.number(). Tanpa konversi ini, safeParse() akan SELALU gagal
 * dengan error "Expected number, received string" -- akibatnya createBaa/
 * updateBaa langsung throw di awal dan data tidak pernah tersimpan ke DB,
 * walau form sudah diisi dengan benar dan lengkap oleh user.
 */
function toValidationNumber(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
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
  keterangan?: string | null;
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
  const odp = await prisma.odp.findUnique({
    where: { id_odp },
    include: { _count: { select: { baa: true } } },
  });
  if (!odp) throw new Error("ODP tidak ditemukan");
  const usedPorts = odp._count.baa;
  const availablePorts = (odp.jumlah_port ?? 0) - usedPorts;
  if (availablePorts <= 0) {
    throw new Error(`Port ODP "${odp.nama_odp}" sudah habis (tersedia: ${availablePorts})`);
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
 * HELPER: Kirim notifikasi material stok rendah ke Admin/Leader/Logistik
 * TEKNISI sengaja tidak dikirimi -- teknisi cuma perlu tau FAB yang
 * ditugaskan ke mereka, bukan urusan stok material.
 * ======================================
 */
async function notifyLowStockToAdmins(materialIds: number[]) {
  if (materialIds.length === 0) return;

  const uniqueIds = [...new Set(materialIds)];

  // Ambil material yang stoknya rendah
  const lowStockMaterials = await prisma.material.findMany({
    where: { id_material: { in: uniqueIds } },
  });

  const materialsNeedingNotification = lowStockMaterials.filter(
    (m) => m.stok <= m.minimal_stok
  );

  if (materialsNeedingNotification.length === 0) return;

  // Ambil semua admin, leader, dan logistik (TEKNISI dihapus dari daftar)
  const adminsAndLeaders = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "LEADER", "LOGISTIK"] },
      status: true,
    },
    select: { id_user: true, nama: true },
  });

  if (adminsAndLeaders.length === 0) return;

  // Buat notification untuk setiap admin/leader/logistik
  // Jika banyak material, buat 1 notifikasi ringkasan
  if (materialsNeedingNotification.length === 1) {
    const m = materialsNeedingNotification[0];
    const notifications = adminsAndLeaders.map((user) => ({
      id_user: user.id_user,
      title: "Stok Material Menipis",
      message: `${m.nama_material} tersisa ${m.stok} ${m.satuan} (minimal: ${m.minimal_stok}). Segera lakukan restok.`,
      link: `/workspace?view=material`,
      type: "SYSTEM" as const,
      is_read: false,
    }));

    await prisma.notification.createMany({ data: notifications });
  } else {
    // Banyak material - buat notifikasi ringkasan
    const materialList = materialsNeedingNotification
      .map((m) => `${m.nama_material} (${m.stok} ${m.satuan})`)
      .join(", ");

    const notifications = adminsAndLeaders.map((user) => ({
      id_user: user.id_user,
      title: "Beberapa Material Stok Menipis",
      message: `${materialsNeedingNotification.length} material perlu restok: ${materialList}`,
      link: `/workspace?view=material`,
      type: "SYSTEM" as const,
      is_read: false,
    }));

    await prisma.notification.createMany({ data: notifications });
  }
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

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_teknisi: (formData.get("nama_teknisi") as string)?.trim() || "",
    username_teknisi: (formData.get("username_teknisi") as string)?.trim().toLowerCase() || "",
    email_teknisi: (formData.get("email_teknisi") as string)?.trim() || undefined,
  };

  // Parse validation
  const parseResult = teknisiValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Cek duplikat username
  const existing = await prisma.user.findUnique({
    where: { username: validated.username_teknisi },
  });

  if (existing) {
    throw new Error(`Username "${validated.username_teknisi}" sudah terdaftar. Gunakan username lain.`);
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

  const hashedPassword = await bcrypt.hash(`${validated.username_teknisi}123`, 10);

  const newUser = await prisma.user.create({
    data: {
      kode_user: kodeUser,
      nama: validated.nama_teknisi,
      username: validated.username_teknisi,
      email: validated.email_teknisi || `${validated.username_teknisi}@passnet.id`,
      password: hashedPassword,
      jkl: "LAKI_LAKI",
      role: "TEKNISI",
      status: true,
    },
  });

  await logActivity("USER_CREATED", `Teknisi "${validated.nama_teknisi}" (${validated.username_teknisi}) dibuat oleh ${session.user.nama}`);
  revalidatePath("/jaringan/baa");

  return {
    success: true,
    data: {
      id_user: newUser.id_user,
      kode_user: newUser.kode_user,
      nama: newUser.nama,
      username: newUser.username,
      email: newUser.email,
      defaultPassword: `${validated.username_teknisi}123`,
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

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const teknisiTambahanRaw = formData.get("teknisi_tambahan") as string | null;
  const teknisiTambahanIds: number[] = teknisiTambahanRaw ? JSON.parse(teknisiTambahanRaw) : [];

  const rawData = {
    tanggal_instalasi: (formData.get("tanggal_instalasi") as string) || "",
    id_fab: parseInt(formData.get("id_fab") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
    id_ont: parseInt(formData.get("id_ont") as string, 10) || 0,
    port_olt: toValidationNumber(formData.get("port_olt")),
    port_odp: toValidationNumber(formData.get("port_odp")),
    rx_power_dbm: toValidationNumber(formData.get("rx_power_dbm")),
    tx_power_dbm: toValidationNumber(formData.get("tx_power_dbm")),
    speed_download: formData.get("speed_download") as string || undefined,
    speed_upload: formData.get("speed_upload") as string || undefined,
    ping_ms: toValidationNumber(formData.get("ping_ms")),
    catatan: formData.get("catatan") as string || undefined,
    baa_details: parseBaaDetails(formData.get("baa_details") as string | null),
    teknisi_tambahan: teknisiTambahanIds,
  };

  // Parse validation
  const parseResult = baaValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const status = "SELESAI" as const;

  // Validasi stok SEBELUM ada perubahan
  await validateMaterialStock(validated.baa_details);
  await validateOdpStock(validated.id_odp);
  await validateOntAvailability(validated.id_ont);

  // Ambil nama pelanggan FAB -- akan ikut disimpan ke Ont.pelanggan supaya
  // data pelanggan di ONT selalu sinkron dan real dari instalasi aktualnya.
  const fabForOnt = await prisma.fab.findUnique({
    where: { id_fab: validated.id_fab },
    select: { nama_pelanggan: true },
  });

  const foto_instalasi = await saveFotoInstalasi(formData, null);
  const kodeSementara = `TMP-${Date.now()}`;

  const newBaa = await prisma.$transaction(async (tx) => {
    // Update status ONT ke TERPASANG, sekaligus catat nama pelanggan dari
    // FAB ini -- supaya Ont.pelanggan selalu sinkron dengan BAA aktif.
    await tx.ont.update({
      where: { id_ont: validated.id_ont },
      data: {
        status: "TERPASANG" as const,
        pelanggan: fabForOnt?.nama_pelanggan ?? "",
      },
    });

    const created = await tx.baa.create({
      data: {
        kode_baa: kodeSementara,
        tanggal_instalasi: new Date(validated.tanggal_instalasi),
        status,
        id_fab: validated.id_fab,
        id_user: validated.id_user,
        id_olt: validated.id_olt,
        id_odp: validated.id_odp,
        id_ont: validated.id_ont,
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
          create: validated.baa_details.map((d) => ({
            id_material: d.id_material,
            jumlah: d.jumlah,
            keterangan: d.keterangan,
          })),
        },
      },
    });

    // Kurangi stok material
    for (const d of validated.baa_details) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { decrement: d.jumlah } },
      });
    }

    // Update status FAB ke AKTIF
    await tx.fab.update({
      where: { id_fab: validated.id_fab },
      data: { status: "AKTIF" },
    });

    return created;
  });

  // Tambah teknisi tambahan
  if (validated.teknisi_tambahan && validated.teknisi_tambahan.length > 0) {
    await prisma.baateknisi.createMany({
      data: validated.teknisi_tambahan.map((id_user) => ({
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

  // Cek material stok rendah dan kirim notifikasi ke admin/leader
  const lowStockMaterials = await getLowStockWarnings(validated.baa_details.map((d) => d.id_material));
  await notifyLowStockToAdmins(validated.baa_details.map((d) => d.id_material));

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

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const teknisiTambahanRaw = formData.get("teknisi_tambahan") as string | null;
  const teknisiTambahanIds: number[] = teknisiTambahanRaw ? JSON.parse(teknisiTambahanRaw) : [];

  const rawData = {
    tanggal_instalasi: (formData.get("tanggal_instalasi") as string) || "",
    id_fab: parseInt(formData.get("id_fab") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
    id_ont: parseInt(formData.get("id_ont") as string, 10) || 0,
    port_olt: toValidationNumber(formData.get("port_olt")),
    port_odp: toValidationNumber(formData.get("port_odp")),
    rx_power_dbm: toValidationNumber(formData.get("rx_power_dbm")),
    tx_power_dbm: toValidationNumber(formData.get("tx_power_dbm")),
    speed_download: formData.get("speed_download") as string || undefined,
    speed_upload: formData.get("speed_upload") as string || undefined,
    ping_ms: toValidationNumber(formData.get("ping_ms")),
    catatan: formData.get("catatan") as string || undefined,
    baa_details: parseBaaDetails(formData.get("baa_details") as string | null),
    teknisi_tambahan: teknisiTambahanIds,
  };

  // Parse validation
  const parseResult = baaValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const existingFoto = (formData.get("foto_instalasi_existing") as string | null) || null;
  const foto_instalasi = await saveFotoInstalasi(formData, existingFoto);

  // Stok yang akan "dikembalikan"
  const restoredStockMap = new Map<number, number>();
  for (const d of oldBaa.baadetail) {
    restoredStockMap.set(d.id_material, (restoredStockMap.get(d.id_material) ?? 0) + d.jumlah);
  }

  await validateMaterialStock(validated.baa_details, restoredStockMap);
  if (oldBaa.id_odp !== validated.id_odp) {
    await validateOdpStock(validated.id_odp);
  }
  // ONT cuma perlu dicek ulang kalau memang diganti -- kalau tetap pakai ONT
  // yang sama seperti sebelumnya, tidak perlu divalidasi lagi (dia sudah
  // "milik" BAA ini).
  if (oldBaa.id_ont !== validated.id_ont) {
    await validateOntAvailability(validated.id_ont, id);
  }

  // Nama pelanggan FAB terbaru -- dipakai untuk sinkronisasi Ont.pelanggan
  // di bawah, baik saat ONT-nya berubah maupun tidak.
  const fabForOnt = await prisma.fab.findUnique({
    where: { id_fab: validated.id_fab },
    select: { nama_pelanggan: true },
  });

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
        tanggal_instalasi: new Date(validated.tanggal_instalasi),
        status: "SELESAI",
        id_fab: validated.id_fab,
        id_user: validated.id_user,
        id_olt: validated.id_olt,
        id_odp: validated.id_odp,
        id_ont: validated.id_ont,
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
          create: validated.baa_details.map((d) => ({
            id_material: d.id_material,
            jumlah: d.jumlah,
            keterangan: d.keterangan,
          })),
        },
      },
    });

    // Kurangi stok material sesuai data baru
    for (const d of validated.baa_details) {
      await tx.material.update({
        where: { id_material: d.id_material },
        data: { stok: { decrement: d.jumlah } },
      });
    }

    // Tangani perubahan ONT + sinkronisasi nama pelanggan
    if (oldBaa.id_ont !== validated.id_ont) {
      if (oldBaa.id_ont !== null) {
        // ONT lama dikembalikan ke TERSEDIA, pelanggan dikosongkan lagi
        await tx.ont.update({
          where: { id_ont: oldBaa.id_ont },
          data: { status: "TERSEDIA" as const, pelanggan: "" },
        });
      }
      // ONT baru diset ke TERPASANG dengan nama pelanggan dari FAB saat ini
      await tx.ont.update({
        where: { id_ont: validated.id_ont },
        data: {
          status: "TERPASANG" as const,
          pelanggan: fabForOnt?.nama_pelanggan ?? "",
        },
      });
    } else {
      // ONT sama, tapi FAB bisa saja berubah (mis. edit nama pelanggan di
      // FAB) -- pastikan Ont.pelanggan tetap ikut yang terbaru.
      await tx.ont.update({
        where: { id_ont: validated.id_ont },
        data: { pelanggan: fabForOnt?.nama_pelanggan ?? "" },
      });
    }

    await tx.fab.update({
      where: { id_fab: validated.id_fab },
      data: { status: "AKTIF" },
    });
  });

  if (validated.teknisi_tambahan && validated.teknisi_tambahan.length > 0) {
    await prisma.baateknisi.createMany({
      data: validated.teknisi_tambahan.map((id_user) => ({
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

  // Cek material stok rendah dan kirim notifikasi ke admin/leader
  const lowStockMaterials = await getLowStockWarnings(validated.baa_details.map((d) => d.id_material));
  await notifyLowStockToAdmins(validated.baa_details.map((d) => d.id_material));

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

    // Kembalikan status ONT ke TERSEDIA (jika BAA memang punya ONT),
    // sekaligus kosongkan nama pelanggan karena ONT sudah tidak terpasang
    if (baa.id_ont !== null) {
      await tx.ont.update({
        where: { id_ont: baa.id_ont },
        data: { status: "TERSEDIA" as const, pelanggan: "" },
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
 * DELETE MULTIPLE BAA
 * ======================================
 */
export async function deleteMultipleBaa(ids: number[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "LEADER") {
    throw new Error("Hanya Admin atau Leader yang bisa menghapus BAA.");
  }

  if (!ids || ids.length === 0) {
    throw new Error("Tidak ada data BAA yang dipilih.");
  }

  // Ambil semua BAA yang akan dihapus
  const baas = await prisma.baa.findMany({
    where: { id_baa: { in: ids } },
    include: { baadetail: true },
  });

  if (baas.length !== ids.length) {
    throw new Error("Beberapa data BAA tidak ditemukan.");
  }

  // Delete semua dalam transaction
  await prisma.$transaction(async (tx) => {
    for (const baa of baas) {
      // Kembalikan stok material
      for (const d of baa.baadetail) {
        await tx.material.update({
          where: { id_material: d.id_material },
          data: { stok: { increment: d.jumlah } },
        });
      }

      // Kembalikan status ONT ke TERSEDIA, kosongkan pelanggan
      if (baa.id_ont !== null) {
        await tx.ont.update({
          where: { id_ont: baa.id_ont },
          data: { status: "TERSEDIA" as const, pelanggan: "" },
        });
      }

      await tx.baateknisi.deleteMany({ where: { id_baa: baa.id_baa } });
      await tx.baadetail.deleteMany({ where: { id_baa: baa.id_baa } });
    }

    // Delete semua BAA
    await tx.baa.deleteMany({ where: { id_baa: { in: ids } } });
  });

  await renumberKodeBaa();
  await logActivity("BAA_DELETED", `${ids.length} BAA dihapus oleh ${session.user.nama}`);

  revalidatePath("/jaringan/baa");
  revalidatePath("/masterdata/material");
  revalidatePath("/masterdata/odp");
  revalidatePath("/masterdata/ont");
}

/**
 * ======================================
 * QUICK CREATE ONT (dari form BAA)
 * ======================================
 * Dipakai saat teknisi scan barcode/QR pabrik untuk ONT fisik baru yang
 * belum terdaftar di sistem. id_odp WAJIB dikirim dan harus sama dengan
 * ODP yang sedang dipilih di form BAA saat itu -- id_pop diturunkan
 * otomatis dari ODP tersebut (satu ODP selalu berada di bawah satu POP
 * tertentu). Nama pelanggan sengaja TIDAK ditangani di sini -- field itu
 * baru terisi otomatis saat BAA yang memakai ONT ini disubmit (lihat
 * sinkronisasi pelanggan di createBaa/updateBaa).
 */
export async function quickCreateOnt(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const serial_number = (formData.get("serial_number") as string)?.trim();
  const rawIdOdp = formData.get("id_odp") as string | null;

  if (!serial_number) {
    throw new Error("Serial number wajib diisi.");
  }

  const id_odp = rawIdOdp ? parseInt(rawIdOdp, 10) : NaN;
  if (isNaN(id_odp)) {
    throw new Error("Pilih ODP di form BAA terlebih dahulu sebelum menambahkan ONT baru.");
  }

  // Cek apakah ONT sudah terdaftar di tabel ONT
  const existing = await prisma.ont.findUnique({
    where: { serial_number },
    include: { baa: true },
  });

  if (existing) {
    // Jika ONT sudah terdaftar
    if (existing.baa && existing.baa.length > 0) {
      // ONT sudah dipakai di BAA lain, tidak bisa dipakai lagi
      throw new Error(`ONT dengan serial number "${serial_number}" sudah dipakai oleh BAA lain.`);
    }

    if (existing.status === "RUSAK") {
      throw new Error(`ONT dengan serial number "${serial_number}" berstatus RUSAK. Gunakan ONT lain.`);
    }

    // ONT sudah terdaftar dan TERSEDIA - gunakan ONT ini
    return {
      success: true,
      data: {
        id_ont: existing.id_ont,
        serial_number: existing.serial_number,
        alreadyExists: true,
      },
    };
  }

  // POP ditentukan otomatis mengikuti ODP yang sedang dipilih di form BAA --
  // satu ODP memang selalu berada di bawah satu POP tertentu, jadi tidak
  // perlu (dan tidak boleh) dipilih terpisah supaya tidak salah pasang.
  const odp = await prisma.odp.findUnique({
    where: { id_odp },
    select: { olt: { select: { id_pop: true } } },
  });

  if (!odp || !odp.olt) {
    throw new Error("ODP atau relasi OLT tidak ditemukan.");
  }

  const id_pop = odp.olt.id_pop;

  // Buat ONT baru dalam transaksi
  const newOnt = await prisma.$transaction(async (tx) => {
    // Double-check dalam transaction
    const existingInTx = await tx.ont.findUnique({ where: { serial_number } });
    if (existingInTx) {
      // Race condition - ONT sudah dibuat oleh request lain, gunakan yang ada
      return existingInTx;
    }

    // pelanggan sengaja dikosongkan -- baru terisi otomatis saat BAA yang
    // memakai ONT ini disubmit (lihat createBaa).
    return await tx.ont.create({
      data: {
        serial_number,
        pelanggan: "",
        status: "TERSEDIA",
        id_pop,
        id_odp,
      },
    });
  });

  await logActivity("ONT_CREATED", `ONT "${serial_number}" dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");

  return {
    success: true,
    data: {
      id_ont: newOnt.id_ont,
      serial_number: newOnt.serial_number,
      alreadyExists: false,
    },
  };
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
// PERBAIKAN BUG HIGHLIGHT (sama seperti FAB): sebelumnya highlightId dipakai
// untuk memfilter where: { id_baa: highlightId }, jadi begitu masuk dari
// notifikasi (?highlight=123) server cuma balikin SATU baris BAA -- akibatnya
// tabel gak bisa balik nampilin semua data walau pencarian dikosongkan.
// Highlight/scroll-ke-baris itu sepenuhnya urusan client (BaaTable.tsx baca
// query param `highlight` sendiri lewat useSearchParams()), jadi di sini
// SELALU ambil semua data. Parameter highlightId sengaja dibiarkan ada di
// signature (biar pemanggil lama yang masih mengirim argumen ini tidak error
// kompilasi), tapi sudah tidak dipakai untuk memfilter apa pun.
export async function getBaaData(highlightId?: number | null) {
  return await prisma.baa.findMany({
    include: {
      fab: true,
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

export async function getPopOptions() {
  return await prisma.pop.findMany({
    orderBy: { nama_pop: "asc" },
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
    select: {
      id_ont: true,
      serial_number: true,
      model: true,
    },
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
      ont: {
        select: {
          id_ont: true,
          serial_number: true,
          model: true,
        },
      },
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