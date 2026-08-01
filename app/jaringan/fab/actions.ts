"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fab");

async function simpanFotoFab(fotoFile: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = fotoFile.name.split(".").pop();
  const fileName = `fab-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const bytes = await fotoFile.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/fab/${fileName}`;
}

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
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const fotoFile = formData.get("foto") as File | null;

if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket) {
  throw new Error("Semua field wajib diisi.");
}

if (!fotoFile || fotoFile.size === 0) {
  throw new Error("Foto depan rumah wajib diisi.");
}

  const status: "OPEN" | "AKTIF" = "OPEN";
  const id_penginput = Number(session.user.id_user);
  const id_user =
    session.user.role === "TEKNISI"
      ? Number(formData.get("id_user"))
      : id_penginput;

  if (session.user.role === "TEKNISI" && !id_user) {
    throw new Error("Pilih sales referral terlebih dahulu.");
  }

  let fotoPath: string | undefined;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
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
        id_penginput,
        foto: fotoPath,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  await renumberKodeFab();
  revalidatePath("/jaringan/fab");
}

export async function updateFab(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const existingFab = await prisma.fab.findUnique({
    where: { id_fab: id },
    select: { id_penginput: true },
  });

  if (!existingFab) {
    throw new Error("Data FAB tidak ditemukan.");
  }

  const isRestrictedRole = session.user.role === "SALES" || session.user.role === "TEKNISI";
  if (isRestrictedRole && existingFab.id_penginput !== Number(session.user.id_user)) {
    throw new Error("Anda tidak memiliki akses untuk mengubah data FAB ini.");
  }

  const nama_pelanggan = formData.get("nama_pelanggan") as string;
  const nik = formData.get("nik") as string;
  const no_hp = formData.get("no_hp") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const id_area = Number(formData.get("id_area"));
  const id_paket = Number(formData.get("id_paket"));
  const fotoFile = formData.get("foto") as File | null;

  if (!nama_pelanggan || !nik || !no_hp || !alamat || !id_area || !id_paket) {
    throw new Error("Semua field wajib diisi.");
  }

  const id_user =
    session.user.role === "TEKNISI"
      ? Number(formData.get("id_user"))
      : Number(session.user.id_user);

  // Foto: kalau user upload file baru, ganti. Kalau kosong, biarkan foto lama (jangan disentuh).
  let fotoPath: string | undefined;
  if (fotoFile && fotoFile.size > 0) {
    fotoPath = await simpanFotoFab(fotoFile);
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
        id_area,
        id_paket,
        id_user,
        ...(fotoPath ? { foto: fotoPath } : {}), // cuma diikutkan kalau ada foto baru
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("NIK ini sudah terdaftar pada data FAB lain.");
    }
    throw error;
  }

  revalidatePath("/jaringan/fab");
}

export async function deleteFab(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  if (session.user.role === "SALES" || session.user.role === "TEKNISI") {
    throw new Error("Anda tidak memiliki akses untuk menghapus data FAB.");
  }

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