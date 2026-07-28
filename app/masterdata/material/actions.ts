"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function deleteMaterial(id: number) {
  await prisma.material.delete({
    where: { id_material: id },
  });

  await renumberKodeMaterial();
  revalidatePath("/masterdata/material");
} 