"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

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

export async function createFab(formData: FormData) {
  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const status = formData.get("status") as "PENDING" | "SURVEY" | "INSTALASI" | "SELESAI";
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const id_user = Number(formData.get("id_user"));

  if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket || !id_user) {
    throw new Error("Semua field wajib diisi.");
  }

  const kodeSementara = `TMP-${Date.now()}`;

  try {
    await prisma.fab.create({
      data: {
        kode_fab: kodeSementara,
        nama_pelanggan,
        nik,
        no_hp,
        alamat,
        latitude,
        longitude,
        status,
        id_area,
        id_paket,
        id_user,
      },
    });
  } catch (error) {
    // ✅ Perbaikan: menggunakan Prisma.PrismaClientKnownRequestError
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  await renumberKodeFab();

  // ❌ redirect("/jaringan/fab") dihapus — menyebabkan sinyal redirect
  // tertangkap oleh try/catch di client (FabDialog), sehingga modal
  // tidak pernah tertutup dan navigasi gagal. revalidatePath sudah
  // cukup untuk me-refresh data di halaman yang sama.
  revalidatePath("/jaringan/fab");
}

export async function updateFab(id: number, formData: FormData) {
  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const status = formData.get("status") as "PENDING" | "SURVEY" | "INSTALASI" | "SELESAI";
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const id_user = Number(formData.get("id_user"));

  if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket || !id_user) {
    throw new Error("Semua field wajib diisi.");
  }

  try {
    await prisma.fab.update({
      where: { id_fab: id },
      data: {
        nama_pelanggan,
        nik,
        no_hp,
        alamat,
        latitude,
        longitude,
        status,
        id_area,
        id_paket,
        id_user,
      },
    });
  } catch (error) {
    // ✅ Perbaikan: menggunakan Prisma.PrismaClientKnownRequestError
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  revalidatePath("/jaringan/fab");
}

export async function deleteFab(id: number) {
  const jumlahBaaTerkait = await prisma.baa.count({
    where: { id_fab: id },
  });

  if (jumlahBaaTerkait > 0) {
    throw new Error(
      `FAB ini tidak bisa dihapus karena masih memiliki ${jumlahBaaTerkait} data BAA (berita acara instalasi) yang terhubung. Hapus atau pindahkan data BAA tersebut terlebih dahulu.`
    );
  }

  await prisma.fab.delete({ where: { id_fab: id } });

  await renumberKodeFab();
  revalidatePath("/jaringan/fab");
}