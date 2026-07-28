"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function renumberKodePaket() {
  const semuaPaket = await prisma.paket.findMany({
    orderBy: { createdAt: "asc" },
    select: { id_paket: true },
  });

  await prisma.$transaction(
    semuaPaket.map((item, i) =>
      prisma.paket.update({
        where: { id_paket: item.id_paket },
        data: { kode_paket: `PKT${String(i + 1).padStart(3, "0")}` },
      })
    )
  );
}

export async function createPaket(formData: FormData) {
  const nama_paket = formData.get("nama_paket") as string;
  const kecepatan = formData.get("kecepatan") as string;
  const harga = Number(formData.get("harga"));
  const keterangan = formData.get("keterangan") as string;

  if (!nama_paket || !kecepatan || !harga) {
    throw new Error("Nama paket, kecepatan, dan harga wajib diisi.");
  }

  const kodeSementara = `TMP-${Date.now()}`;

  await prisma.paket.create({
    data: {
      kode_paket: kodeSementara,
      nama_paket,
      kecepatan,
      harga,
      keterangan: keterangan || null,
    },
  });

  await renumberKodePaket();
  revalidatePath("/masterdata/paket");
  redirect("/masterdata/paket");
}

export async function updatePaket(id: number, formData: FormData) {
  const nama_paket = formData.get("nama_paket") as string;
  const kecepatan = formData.get("kecepatan") as string;
  const harga = Number(formData.get("harga"));
  const keterangan = formData.get("keterangan") as string;

  if (!nama_paket || !kecepatan || !harga) {
    throw new Error("Nama paket, kecepatan, dan harga wajib diisi.");
  }

  await prisma.paket.update({
    where: { id_paket: id },
    data: {
      nama_paket,
      kecepatan,
      harga,
      keterangan: keterangan || null,
    },
  });

  revalidatePath("/masterdata/paket");
  redirect("/masterdata/paket");
}

export async function deletePaket(id: number) {
  await prisma.paket.delete({
    where: { id_paket: id },
  });

  await renumberKodePaket();
  revalidatePath("/masterdata/paket");
}