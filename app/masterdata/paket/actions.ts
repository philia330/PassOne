"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * ======================================
 * HELPER: Rapikan ulang kode_paket
 * ======================================
 * Dipanggil setelah create/delete supaya kode_paket di database
 * SELALU rapat berurutan (PKT001, PKT002, PKT003, ...) tanpa gap,
 * mengikuti urutan data dibuat (createdAt).
 */
async function renumberKodePaket() {
  const semuaPaket = await prisma.paket.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_paket: true },
  });

  // Diproses berurutan dari nomor terkecil, aman dari bentrok constraint unique
  // karena setiap kode lama otomatis "dikosongkan" sebelum dipakai ulang.
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
  const nama_paket = formData.get("nama_paket") as string;
  const kecepatan = formData.get("kecepatan") as string;
  const harga = Number(formData.get("harga"));
  const keterangan = formData.get("keterangan") as string;

  // Pakai kode sementara yang PASTI unik (timestamp) supaya insert tidak
  // pernah bentrok dengan data lama, apapun kondisi database saat ini.
  // Kode aslinya (PKT001, PKT002, dst) baru diberikan lewat renumberKodePaket().
  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.paket.create({
    data: {
      kode_paket: kodeSementara,
      nama_paket,
      kecepatan,
      harga,
      keterangan,
    },
  });

  // Rapikan ulang semua kode paket jadi PKT001, PKT002, ... tanpa gap
  await renumberKodePaket();

  revalidatePath("/paket");
  redirect("/paket");
}

/**
 * ======================================
 * UPDATE PAKET
 * ======================================
 */
export async function updatePaket(id: number, formData: FormData) {
  const nama_paket = formData.get("nama_paket") as string;
  const kecepatan = formData.get("kecepatan") as string;
  const harga = Number(formData.get("harga"));
  const keterangan = formData.get("keterangan") as string;

  // kode_paket TIDAK diubah manual dari form edit, biar konsisten
  // dengan hasil renumbering otomatis (hindari user override nomor urut)
  await prisma.paket.update({
    where: {
      id_paket: id,
    },
    data: {
      nama_paket,
      kecepatan,
      harga,
      keterangan,
    },
  });

  revalidatePath("/paket");
  redirect("/paket");
}

/**
 * ======================================
 * DELETE PAKET
 * ======================================
 */
export async function deletePaket(id: number) {
  await prisma.paket.delete({
    where: {
      id_paket: id,
    },
  });

  // Rapikan ulang kode_paket sisa data supaya tidak ada gap
  await renumberKodePaket();

  revalidatePath("/paket");
}