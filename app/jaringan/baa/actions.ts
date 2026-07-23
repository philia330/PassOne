"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * ======================================
 * HELPER: Simpan foto instalasi
 * ======================================
 * File dari <input type="file" name="foto_instalasi"> ditulis ke
 * public/uploads/baa/, lalu path publiknya (/uploads/baa/xxx.jpg)
 * yang disimpan ke kolom foto_instalasi (String) di database.
 *
 * Kalau user tidak pilih file baru (misal pas edit), foto lama
 * (dikirim lewat hidden input foto_instalasi_existing) tetap dipakai.
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

    // Nama file dibuat unik pakai timestamp, ekstensi diambil dari file asli
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `baa-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    return `/uploads/baa/${filename}`;
  }

  // Tidak ada file baru diupload -> pertahankan foto lama (bisa null kalau belum pernah ada)
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

// Ambil angka opsional dari FormData -> number | null (kalau kosong)
function toOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

// Ambil string opsional dari FormData -> string | null (kalau kosong)
function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (value === null || value === "") return null;
  return value as string;
}

// Parse daftar material (baa_details) yang dikirim sebagai JSON dari client
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
      .filter((d) => d.id_material && d.jumlah) // buang baris kosong
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
 * CREATE BAA
 * ======================================
 * Material (BaaDetail) dibuat sekaligus (nested create) dalam satu operasi
 * atomik bareng BAA-nya — Prisma otomatis membungkusnya dalam transaksi.
 */
export async function createBaa(formData: FormData) {
  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
  const status = formData.get("status") as "PENDING" | "PROSES" | "SELESAI";
  const id_fab = Number(formData.get("id_fab"));
  const id_user = Number(formData.get("id_user"));
  const id_olt = Number(formData.get("id_olt"));
  const id_odp = Number(formData.get("id_odp"));
  const id_ont = Number(formData.get("id_ont"));

  if (!tanggal_instalasi || !id_fab || !id_user || !id_olt || !id_odp || !id_ont) {
    throw new Error("Tanggal instalasi, FAB, Teknisi, OLT, ODP, dan ONT wajib diisi.");
  }

  const details = parseBaaDetails(formData.get("baa_details") as string | null);
  const foto_instalasi = await saveFotoInstalasi(formData, null);
  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.baa.create({
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
      // Nested create — baris BaaDetail langsung dibuat bareng BAA induknya
      baaDetails: {
        create: details.map((d) => ({
          id_material: d.id_material,
          jumlah: d.jumlah,
          keterangan: d.keterangan,
        })),
      },
    },
  });

  await renumberKodeBaa();

  revalidatePath("/jaringan/baa");
}

/**
 * ======================================
 * UPDATE BAA
 * ======================================
 * Strategi material: hapus semua BaaDetail lama punya BAA ini, lalu buat
 * ulang dari daftar yang dikirim form — lebih simpel & aman daripada
 * membandingkan baris mana yang berubah/dihapus/ditambah satu-satu.
 */
export async function updateBaa(id: number, formData: FormData) {
  const tanggal_instalasi = formData.get("tanggal_instalasi") as string;
  const status = formData.get("status") as "PENDING" | "PROSES" | "SELESAI";
  const id_fab = Number(formData.get("id_fab"));
  const id_user = Number(formData.get("id_user"));
  const id_olt = Number(formData.get("id_olt"));
  const id_odp = Number(formData.get("id_odp"));
  const id_ont = Number(formData.get("id_ont"));

  if (!tanggal_instalasi || !id_fab || !id_user || !id_olt || !id_odp || !id_ont) {
    throw new Error("Tanggal instalasi, FAB, Teknisi, OLT, ODP, dan ONT wajib diisi.");
  }

  const details = parseBaaDetails(formData.get("baa_details") as string | null);
  const existingFoto = (formData.get("foto_instalasi_existing") as string | null) || null;
  const foto_instalasi = await saveFotoInstalasi(formData, existingFoto);

  await prisma.$transaction([
    prisma.baaDetail.deleteMany({ where: { id_baa: id } }),
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
        baaDetails: {
          create: details.map((d) => ({
            id_material: d.id_material,
            jumlah: d.jumlah,
            keterangan: d.keterangan,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/jaringan/baa");
}

/**
 * ======================================
 * DELETE BAA
 * ======================================
 * BaaDetail (anak) harus dihapus dulu sebelum BAA (induk) dihapus,
 * karena ada foreign key constraint.
 */
export async function deleteBaa(id: number) {
  await prisma.$transaction([
    prisma.baaDetail.deleteMany({ where: { id_baa: id } }),
    prisma.baa.delete({ where: { id_baa: id } }),
  ]);

  await renumberKodeBaa();

  revalidatePath("/jaringan/baa");
}