"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

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

function toOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
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
  const status = formData.get("status") as "PENDING" | "PROSES" | "SELESAI";
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
  const foto_instalasi = await saveFotoInstalasi(formData, null);
  const kodeSementara = `TMP-${Date.now()}`;

  const newBaa = await prisma.baa.create({
    data: {
      kode_baa: kodeSementara,
      tanggal_instalasi: new Date(tanggal_instalasi),
      status,
      id_fab,
      id_user,
      id_olt,
      id_odp,
      id_ont,
      port_olt: toOptionalNumber(formData.get("port_olt")),
      port_odp: toOptionalNumber(formData.get("port_odp")),
      rx_power_dbm: toOptionalNumber(formData.get("rx_power_dbm")),
      tx_power_dbm: toOptionalNumber(formData.get("tx_power_dbm")),
      speed_download: toOptionalString(formData.get("speed_download")),
      speed_upload: toOptionalString(formData.get("speed_upload")),
      ping_ms: toOptionalNumber(formData.get("ping_ms")),
      catatan: toOptionalString(formData.get("catatan")),
      foto_instalasi,
      baadetail: {
        // pakai baadetail (huruf kecil semua)
        create: details.map((d) => ({
          id_material: d.id_material,
          jumlah: d.jumlah,
          keterangan: d.keterangan,
        })),
      },
    },
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
}

// ================================================================
// 5. UPDATE BAA
// ================================================================
export async function updateBaa(id: number, formData: FormData) {
  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
  const status = formData.get("status") as "PENDING" | "PROSES" | "SELESAI";
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

  // Hapus teknisi tambahan lama
  await prisma.baateknisi.deleteMany({
    where: { id_baa: id },
  });

  await prisma.$transaction([
    prisma.baadetail.deleteMany({ where: { id_baa: id } }),
    prisma.baa.update({
      where: { id_baa: id },
      data: {
        tanggal_instalasi: new Date(tanggal_instalasi),
        status,
        id_fab,
        id_user,
        id_olt,
        id_odp,
        id_ont,
        port_olt: toOptionalNumber(formData.get("port_olt")),
        port_odp: toOptionalNumber(formData.get("port_odp")),
        rx_power_dbm: toOptionalNumber(formData.get("rx_power_dbm")),
        tx_power_dbm: toOptionalNumber(formData.get("tx_power_dbm")),
        speed_download: toOptionalString(formData.get("speed_download")),
        speed_upload: toOptionalString(formData.get("speed_upload")),
        ping_ms: toOptionalNumber(formData.get("ping_ms")),
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
    }),
  ]);

  if (teknisiTambahanIds.length > 0) {
    await prisma.baateknisi.createMany({
      data: teknisiTambahanIds.map((id_user) => ({
        id_baa: id,
        id_user,
      })),
    });
  }

  revalidatePath("/jaringan/baa");
}

// ================================================================
// 6. DELETE BAA
// ================================================================
export async function deleteBaa(id: number) {
  // Hapus teknisi tambahan
  await prisma.baateknisi.deleteMany({
    where: { id_baa: id },
  });

  // Hapus detail material
  await prisma.baadetail.deleteMany({
    where: { id_baa: id },
  });

  // Hapus BAA
  await prisma.baa.delete({
    where: { id_baa: id },
  });

  await renumberKodeBaa();
  revalidatePath("/jaringan/baa");
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