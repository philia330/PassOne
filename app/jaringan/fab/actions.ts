"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { optimizeImageToWebP } from "@/lib/image-utils";
import { z } from "zod";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fab");

// ======================================================
// FAB VALIDATION SCHEMA
// ======================================================

const fabValidation = z.object({
  nama_pelanggan: z
    .string()
    .min(1, "Nama pelanggan wajib diisi.")
    .min(2, "Nama pelanggan minimal 2 karakter.")
    .max(100, "Nama pelanggan maksimal 100 karakter."),
  nik: z
    .string()
    .min(1, "NIK wajib diisi.")
    .length(16, "NIK harus tepat 16 digit.")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka."),
  no_hp: z
    .string()
    .min(1, "Nomor HP wajib diisi.")
    .regex(/^(\+?62|0)[0-9]{9,14}$/, "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx")
    .max(15, "Nomor HP maksimal 15 karakter."),
  alamat: z
    .string()
    .min(1, "Alamat wajib diisi.")
    .min(10, "Alamat minimal 10 karakter.")
    .max(500, "Alamat maksimal 500 karakter."),
  latitude: z
    .number()
    .min(-90, "Latitude tidak valid.")
    .max(90, "Latitude tidak valid."),
  longitude: z
    .number()
    .min(-180, "Longitude tidak valid.")
    .max(180, "Longitude tidak valid."),
  id_area: z.number().int().positive("Area wajib dipilih."),
  id_paket: z.number().int().positive("Paket wajib dipilih."),
  id_user: z.number().int().positive("Sales wajib dipilih."),
});

/**
 * ======================================
 * HELPER: Simpan Foto (WebP optimized)
 * ======================================
 */
async function simpanFotoFab(fotoFile: File): Promise<string> {
  return optimizeImageToWebP(fotoFile, "fab");
}

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
 * HELPER: Cek duplikat NIK (race condition safe)
 * ======================================
 */
async function checkNikDuplicate(nik: string, excludeId?: number): Promise<boolean> {
  const where: any = { nik };
  if (excludeId) {
    where.id_fab = { not: excludeId };
  }

  const existing = await prisma.fab.findFirst({ where });
  return !!existing;
}

/**
 * ======================================
 * HELPER: Renumber kode FAB
 * ======================================
 */
async function renumberKodeFab() {
  const semuaFab = await prisma.fab.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_fab: true },
  });

  await prisma.$transaction(
    semuaFab.map((item, i) =>
      prisma.fab.update({
        where: { id_fab: item.id_fab },
        data: { kode_fab: `FAB${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

/**
 * ======================================
 * CREATE FAB - dengan proteksi duplikat
 * ======================================
 */
export async function createFab(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pelanggan: (formData.get("nama_pelanggan") as string)?.trim() || "",
    nik: (formData.get("nik") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    id_paket: parseInt(formData.get("id_paket") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = fabValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  const fotoFile = formData.get("foto") as File | null;

  if (!fotoFile || fotoFile.size === 0) {
    throw new Error("Foto depan rumah wajib diisi.");
  }

  // ======================================
  // CEK DUPLIKAT SEBELUM INSERT
  // ======================================
  const isDuplicate = await checkNikDuplicate(validated.nik);
  if (isDuplicate) {
    throw new Error(`NIK "${validated.nik}" sudah terdaftar. Gunakan NIK yang berbeda.`);
  }

  const status: "OPEN" | "AKTIF" = "OPEN";
  const id_penginput = Number(session.user.id_user);
  const id_user =
    session.user.role === "TEKNISI"
      ? validated.id_user
      : id_penginput;

  if (session.user.role === "TEKNISI" && !id_user) {
    throw new Error("Pilih sales referral terlebih dahulu.");
  }

  let fotoPath: string | undefined;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
  }

  const kodeSementara = `TMP-${Date.now()}`;

  // ======================================
  // TRANSACTION - atomic operation
  // ======================================
  let createdFabId: number = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // Double-check NIK di dalam transaction (paling akurat)
      const existingInTx = await tx.fab.findFirst({
        where: { nik: validated.nik },
      });

      if (existingInTx) {
        throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
      }

      const created = await tx.fab.create({
        data: {
          kode_fab: kodeSementara,
          nama_pelanggan: validated.nama_pelanggan,
          nik: validated.nik,
          no_hp: validated.no_hp,
          alamat: validated.alamat,
          latitude: validated.latitude,
          longitude: validated.longitude,
          status,
          id_area: validated.id_area,
          id_paket: validated.id_paket,
          id_user,
          id_penginput,
          foto: fotoPath,
        },
      });

      createdFabId = created.id_fab;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar. Gunakan NIK yang berbeda.");
    }
    throw error;
  }

  await renumberKodeFab();
  await logActivity("FAB_CREATED", `FAB "${validated.nama_pelanggan}" (NIK: ${validated.nik}) dibuat oleh ${session.user.nama}`);

  // Kirim notifikasi ke Admin, Leader, dan Sales bahwa ada FAB baru yang perlu ditugaskan
  const targetUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "LEADER", "SALES"] },
      status: true,
    },
    select: { id_user: true, nama: true },
  });

  // Ambil data FAB yang baru dibuat (setelah renumber)
  const newFab = await prisma.fab.findFirst({
    where: {
      nik: validated.nik,
    },
    select: { id_fab: true, kode_fab: true },
    orderBy: { createdAt: "desc" },
  });

  if (newFab && targetUsers.length > 0) {
    // Admin & Leader: tidak kirim ke diri sendiri
    // Sales: KIRIM ke semua sales termasuk yang membuat FAB (untuk tracking FAB OPEN)
    const notifications = targetUsers
      .filter((u) => {
        // Admin dan Leader tidak perlu kirim ke diri sendiri
        if ((session.user.role === "ADMIN" || session.user.role === "LEADER") && u.id_user === session.user.id_user) {
          return false;
        }
        return true;
      })
      .map((user) => ({
        id_user: user.id_user,
        title: "FAB Baru Perlu Ditugaskan",
        message: `FAB baru ${newFab.kode_fab} - ${validated.nama_pelanggan} perlu ditugaskan ke teknisi.`,
        link: `/jaringan/fab?highlight=${newFab.id_fab}`,
        type: "FAB_OPEN" as const,
        is_read: false,
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * UPDATE FAB - dengan race condition protection
 * ======================================
 */
export async function updateFab(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Ambil data lama untuk audit
  const existingFab = await prisma.fab.findUnique({
    where: { id_fab: id },
  });

  if (!existingFab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  // Cek hak akses
  const isRestrictedRole = session.user.role === "SALES" || session.user.role === "TEKNISI";
  if (isRestrictedRole && existingFab.id_penginput !== Number(session.user.id_user)) {
    throw new Error("Anda tidak memiliki akses untuk mengubah data FAB ini.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nama_pelanggan: (formData.get("nama_pelanggan") as string)?.trim() || "",
    nik: (formData.get("nik") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    alamat: (formData.get("alamat") as string)?.trim() || "",
    latitude: parseFloat(formData.get("latitude") as string) || 0,
    longitude: parseFloat(formData.get("longitude") as string) || 0,
    id_area: parseInt(formData.get("id_area") as string, 10) || 0,
    id_paket: parseInt(formData.get("id_paket") as string, 10) || 0,
    id_user: parseInt(formData.get("id_user") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = fabValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // ======================================
  // CEK DUPLIKAT NIK (jika berubah)
  // ======================================
  if (validated.nik !== existingFab.nik) {
    const isDuplicate = await checkNikDuplicate(validated.nik, id);
    if (isDuplicate) {
      throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
    }
  }

  // PERBAIKAN: sebelumnya baris ini memaksa id_user (field Sales) jadi ID
  // orang yang SEDANG EDIT untuk role selain TEKNISI --
  //   session.user.role === "TEKNISI" ? validated.id_user : Number(session.user.id_user)
  // -- padahal form (FabForm.tsx) sudah mengirim nilai id_user yang benar
  // untuk semua role (dikunci ke Sales asli / dipilih via dropdown untuk
  // Teknisi). Akibatnya field Sales diam-diam ketimpa jadi nama editor
  // setiap kali Admin/Leader mengedit FAB. Sekarang tinggal pakai nilai
  // yang sudah tervalidasi dari form, sama seperti id_area & id_paket.
  const id_user = validated.id_user;

  let fotoPath: string | undefined;
  const fotoFile = formData.get("foto") as File | null;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Double-check NIK duplikat di dalam transaction
      if (validated.nik !== existingFab.nik) {
        const existingInTx = await tx.fab.findFirst({
          where: { nik: validated.nik, id_fab: { not: id } },
        });

        if (existingInTx) {
          throw new Error(`NIK "${validated.nik}" sudah digunakan oleh data lain.`);
        }
      }

      await tx.fab.update({
        where: { id_fab: id },
        data: {
          nama_pelanggan: validated.nama_pelanggan,
          nik: validated.nik,
          no_hp: validated.no_hp,
          alamat: validated.alamat,
          latitude: validated.latitude,
          longitude: validated.longitude,
          id_area: validated.id_area,
          id_paket: validated.id_paket,
          id_user,
          ...(fotoPath ? { foto: fotoPath } : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar. Gunakan NIK yang berbeda.");
    }
    throw error;
  }

  await logActivity("FAB_UPDATED", `FAB "${validated.nama_pelanggan}" (NIK: ${validated.nik}) diupdate oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * DELETE FAB - dengan proteksi data terkait
 * ======================================
 */
export async function deleteFab(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role === "SALES" || session.user.role === "TEKNISI") {
    throw new Error("Anda tidak memiliki akses untuk menghapus data FAB.");
  }

  // Ambil data sebelum hapus untuk log
  const fab = await prisma.fab.findUnique({
    where: { id_fab: id },
    select: { nama_pelanggan: true, nik: true },
  });

  if (!fab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  const jumlahBaa = await prisma.baa.count({
    where: { id_fab: id },
  });

  if (jumlahBaa > 0) {
    throw new Error(
      `FAB "${fab.nama_pelanggan}" tidak bisa dihapus karena masih memiliki ${jumlahBaa} data BAA. Hapus atau pindahkan data BAA tersebut terlebih dahulu.`
    );
  }

  // Transaction untuk delete
  await prisma.$transaction(async (tx) => {
    await tx.fab.delete({ where: { id_fab: id } });
  });

  await renumberKodeFab();
  await logActivity("FAB_DELETED", `FAB "${fab.nama_pelanggan}" (NIK: ${fab.nik}) dihapus oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * DELETE MULTIPLE FAB
 * ======================================
 */
export async function deleteMultipleFab(ids: number[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role === "SALES" || session.user.role === "TEKNISI") {
    throw new Error("Anda tidak memiliki akses untuk menghapus data FAB.");
  }

  if (!ids || ids.length === 0) {
    throw new Error("Tidak ada data FAB yang dipilih.");
  }

  // Cek semua FAB yang akan dihapus
  const fabs = await prisma.fab.findMany({
    where: { id_fab: { in: ids } },
    select: { id_fab: true, nama_pelanggan: true },
  });

  if (fabs.length !== ids.length) {
    throw new Error("Beberapa data FAB tidak ditemukan.");
  }

  // Cek apakah ada yang masih memiliki BAA
  const fabsWithBaa = await Promise.all(
    fabs.map(async (fab) => {
      const count = await prisma.baa.count({ where: { id_fab: fab.id_fab } });
      return count > 0 ? fab : null;
    })
  );

  const fabsWithBaaFiltered = fabsWithBaa.filter(Boolean);
  if (fabsWithBaaFiltered.length > 0) {
    throw new Error(
      `${fabsWithBaaFiltered.length} FAB tidak bisa dihapus karena masih memiliki data BAA.`
    );
  }

  // Delete semua
  await prisma.$transaction(async (tx) => {
    await tx.fab.deleteMany({ where: { id_fab: { in: ids } } });
  });

  await renumberKodeFab();
  await logActivity("FAB_DELETED", `${ids.length} FAB dihapus oleh ${session.user.nama}`);
  revalidatePath("/jaringan/fab");
}

/**
 * ======================================
 * ASSIGN FAB TO TEKNISI (FITUR B)
 * ======================================
 */
export async function assignFabToTeknisi(idFab: number, idTeknisi: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Validasi role: hanya ADMIN, LEADER, atau SALES yang bisa assign
  const allowedRoles = ["ADMIN", "LEADER", "SALES"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Anda tidak memiliki akses untuk menugaskan FAB.");
  }

  // Validasi input
  if (!idFab || idFab <= 0) {
    throw new Error("ID FAB tidak valid.");
  }

  if (!idTeknisi || idTeknisi <= 0) {
    throw new Error("Pilih teknisi yang akan ditugaskan.");
  }

  // Cek FAB exists
  const fab = await prisma.fab.findUnique({
    where: { id_fab: idFab },
    include: {
      teknisiDitugaskan: {
        select: { id_user: true, nama: true },
      },
    },
  });

  if (!fab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  if (session.user.role === "SALES" && fab.id_penginput !== Number(session.user.id_user)) {
    throw new Error("FAB ini bukan milik Anda. Hanya FAB yang Anda buat yang bisa ditugaskan.");
  }

  // Validasi: FAB harus berstatus OPEN untuk bisa ditugaskan
  if (fab.status === "AKTIF") {
    throw new Error("FAB ini sudah berstatus Aktif, tidak bisa ditugaskan lagi.");
  }

  // Cek teknisi exists dan ber-role TEKNISI
  const teknisi = await prisma.user.findUnique({
    where: { id_user: idTeknisi },
  });

  if (!teknisi) {
    throw new Error("Teknisi tidak ditemukan.");
  }

  if (teknisi.role !== "TEKNISI") {
    throw new Error("User yang dipilih bukan ber-role Teknisi.");
  }

  if (!teknisi.status) {
    throw new Error("Teknisi yang dipilih berstatus nonaktif.");
  }

  // Update FAB dengan teknisi
  await prisma.fab.update({
    where: { id_fab: idFab },
    data: {
      id_teknisi_ditugaskan: idTeknisi,
    },
  });

  // Buat notifikasi untuk teknisi - TAMPILKAN siapa yang assign dan role-nya
  const notificationLink = `/jaringan/fab?highlight=${idFab}`;
  await prisma.notification.create({
    data: {
      id_user: idTeknisi,
      title: "FAB Ditugaskan",
      message: `${fab.kode_fab} - ${fab.nama_pelanggan} ditugaskan kepada Anda. Ditugaskan oleh: ${session.user.nama} (${session.user.role})`,
      link: notificationLink,
      type: "FAB_ASSIGNED",
      is_read: false,
    },
  });

  // Log activity
  const teknisiName = teknisi.nama;
  const penginputName = session.user.nama;
  await logActivity(
    "FAB_UPDATED",
    `FAB ${fab.kode_fab} - ${fab.nama_pelanggan} ditugaskan ke teknisi ${teknisiName} oleh ${penginputName}`
  );

  revalidatePath("/jaringan/fab");
  return { success: true };
}

/**
 * ======================================
 * BULK ASSIGN FAB TO TEKNISI (FITUR B - BONUS)
 * ======================================
 */
export async function bulkAssignFabToTeknisi(idFabs: number[], idTeknisi: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  // Validasi role
  const allowedRoles = ["ADMIN", "LEADER", "SALES"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Anda tidak memiliki akses untuk menugaskan FAB.");
  }

  // Validasi input
  if (!idFabs || idFabs.length === 0) {
    throw new Error("Pilih FAB yang ingin ditugaskan.");
  }

  if (!idTeknisi || idTeknisi <= 0) {
    throw new Error("Pilih teknisi yang akan ditugaskan.");
  }

  // Cek teknisi exists dan ber-role TEKNISI
  const teknisi = await prisma.user.findUnique({
    where: { id_user: idTeknisi },
  });

  if (!teknisi) {
    throw new Error("Teknisi tidak ditemukan.");
  }

  if (teknisi.role !== "TEKNISI") {
    throw new Error("User yang dipilih bukan ber-role Teknisi.");
  }

  if (!teknisi.status) {
    throw new Error("Teknisi yang dipilih berstatus nonaktif.");
  }

  // Ambil semua FAB yang dipilih beserta statusnya
  const fabs = await prisma.fab.findMany({
    where: { id_fab: { in: idFabs } },
    select: {
      id_fab: true,
      kode_fab: true,
      nama_pelanggan: true,
      status: true,
      id_penginput: true,
    },
  });

  if (fabs.length !== idFabs.length) {
    throw new Error("Beberapa FAB tidak ditemukan.");
  }

  const allowedFabs =
    session.user.role === "SALES"
      ? fabs.filter((f) => f.id_penginput === Number(session.user.id_user))
      : fabs;

  const unauthorizedFabs =
    session.user.role === "SALES"
      ? fabs.filter((f) => f.id_penginput !== Number(session.user.id_user))
      : [];

  if (session.user.role === "SALES" && allowedFabs.length === 0) {
    throw new Error("Tidak ada FAB milik Anda yang dipilih. Hanya FAB yang Anda buat yang bisa ditugaskan.");
  }

  // Filter FABs yang bisa ditugaskan (hanya OPEN) vs yang dilewati (AKTIF)
  const fabsToAssign = allowedFabs.filter((f) => f.status === "OPEN");
  const skippedFabs = allowedFabs.filter((f) => f.status === "AKTIF");

  if (fabsToAssign.length === 0) {
    throw new Error(
      session.user.role === "SALES"
        ? "Semua FAB milik Anda yang dipilih sudah berstatus Aktif, tidak bisa ditugaskan."
        : "Semua FAB yang dipilih sudah berstatus Aktif, tidak bisa ditugaskan."
    );
  }

  // Bulk update hanya FABs yang berstatus OPEN
  await prisma.fab.updateMany({
    where: { id_fab: { in: fabsToAssign.map((f) => f.id_fab) } },
    data: {
      id_teknisi_ditugaskan: idTeknisi,
    },
  });

  // Bulk create notifications untuk teknisi - TAMPILKAN siapa yang assign dan role-nya
  const notifications = fabsToAssign.map((fab) => ({
    id_user: idTeknisi,
    title: "FAB Ditugaskan",
    message: `${fab.kode_fab} - ${fab.nama_pelanggan} ditugaskan kepada Anda. Ditugaskan oleh: ${session.user.nama} (${session.user.role})`,
    link: `/jaringan/fab?highlight=${fab.id_fab}`,
    type: "FAB_ASSIGNED" as const,
    is_read: false,
  }));

  await prisma.notification.createMany({ data: notifications });

  // Log activity
  const skippedMsg = skippedFabs.length > 0 ? ` (${skippedFabs.length} FAB berstatus Aktif dilewati)` : "";
  const unauthorizedMsg = unauthorizedFabs.length > 0 ? ` (${unauthorizedFabs.length} FAB bukan milik Anda dilewati)` : "";
  await logActivity(
    "FAB_UPDATED",
    `${fabsToAssign.length} FAB ditugaskan ke teknisi ${teknisi.nama}${skippedMsg}${unauthorizedMsg} oleh ${session.user.nama}`
  );

  revalidatePath("/jaringan/fab");
  return {
    success: true,
    count: fabsToAssign.length,
    skippedCount: skippedFabs.length,
    unauthorizedCount: unauthorizedFabs.length,
    skippedFabs: skippedFabs.map((f) => f.kode_fab),
    unauthorizedFabs: unauthorizedFabs.map((f) => f.kode_fab),
  };
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
// PERBAIKAN BUG HIGHLIGHT: sebelumnya function ini menerima highlightId dan
// memfilter where: { id_fab: highlightId } kalau ada -- akibatnya begitu
// masuk dari notifikasi (?highlight=123), tabel FAB cuma menerima SATU baris
// data dari server. Efeknya: menghapus teks di kolom pencarian di client jadi
// percuma, karena sumber datanya sendiri memang cuma 1 baris -- baru normal
// lagi kalau klik ulang menu FAB di sidebar (fetch server dari nol).
// Highlight/scroll-ke-baris itu sepenuhnya urusan client (FabTable.tsx baca
// query param `highlight` sendiri lewat useSearchParams()), jadi server
// SELALU harus kirim semua data, parameter highlightId tidak lagi dipakai.
export async function getFabs() {
  return prisma.fab.findMany({
    include: {
      area: true,
      paket: true,
      users: true,
      penginput: true,
      teknisiDitugaskan: true,
    },
    orderBy: { createdAt: "desc" },
  });
}