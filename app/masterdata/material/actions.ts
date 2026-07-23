"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * ======================================
 * HELPER: Rapikan ulang kode_material
 * ======================================
 * Sama seperti modul Paket — dipanggil setelah create/delete supaya
 * kode_material di database selalu rapat (MTR001, MTR002, ...) tanpa gap.
 */
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
 * TIDAK pakai redirect() — dipanggil dari MaterialDialog (modal),
 * bukan navigasi halaman penuh.
 */
export async function createMaterial(formData: FormData) {
  const nama_material = formData.get("nama_material") as string;
  const stok = Number(formData.get("stok"));
  const minimal_stok = Number(formData.get("minimal_stok"));
  const satuan = formData.get("satuan") as string;
  const harga = Number(formData.get("harga"));
  const kondisi = formData.get("kondisi") as "BAIK" | "RUSAK";
  const keterangan = formData.get("keterangan") as string;

  if (!nama_material || !satuan || !harga) {
    throw new Error("Semua field wajib diisi, kecuali keterangan.");
  }

  // Kode sementara dijamin unik (timestamp), dirapikan setelah insert
  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.material.create({
    data: {
      kode_material: kodeSementara,
      nama_material,
      stok,
      minimal_stok,
      satuan,
      harga,
      kondisi,
      keterangan: keterangan || null,
    },
  });

  await renumberKodeMaterial();

  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * UPDATE MATERIAL
 * ======================================
 */
export async function updateMaterial(id: number, formData: FormData) {
  const nama_material = formData.get("nama_material") as string;
  const stok = Number(formData.get("stok"));
  const minimal_stok = Number(formData.get("minimal_stok"));
  const satuan = formData.get("satuan") as string;
  const harga = Number(formData.get("harga"));
  const kondisi = formData.get("kondisi") as "BAIK" | "RUSAK";
  const keterangan = formData.get("keterangan") as string;

  if (!nama_material || !satuan || !harga) {
    throw new Error("Semua field wajib diisi, kecuali keterangan.");
  }

  // kode_material TIDAK diubah manual, biar konsisten dengan renumbering
  await prisma.material.update({
    where: { id_material: id },
    data: {
      nama_material,
      stok,
      minimal_stok,
      satuan,
      harga,
      kondisi,
      keterangan: keterangan || null,
    },
  });

  revalidatePath("/masterdata/material");
}

/**
 * ======================================
 * DELETE MATERIAL
 * ======================================
 * Menerima id secara LANGSUNG, sama seperti deletePaket.
 */
export async function deleteMaterial(id: number) {
  await prisma.material.delete({
    where: { id_material: id },
  });

  await renumberKodeMaterial();

  revalidatePath("/masterdata/material");
}