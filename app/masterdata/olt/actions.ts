"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
// import { requireRole, requireAuth } from "@/lib/auth/guards"; // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge dari Project Lead
// import { logActivity } from "@/lib/activity-log"; // TODO: aktifkan lagi setelah lib/activity-log.ts & auth.ts di-merge dari Project Lead

const PAGE_SIZE = 10;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "olt");

// ======================================================
// Simpan file foto OLT ke public/uploads/olt, return path relatif
// ======================================================
const saveFotoOlt = async (file: File): Promise<string> => {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".jpg";
  const filename = `olt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await writeFile(filePath, buffer);

  return `/uploads/olt/${filename}`;
};

// Hapus file foto lama dari disk (dipanggil saat foto diganti/data dihapus)
const deleteFotoOlt = async (fotoPath: string | null) => {
  if (!fotoPath) return;
  try {
    const fullPath = path.join(process.cwd(), "public", fotoPath);
    await unlink(fullPath);
  } catch {
    // Kalau file sudah tidak ada, abaikan saja
  }
};

// ======================================================
// Generate kode_olt otomatis, mengisi celah/gap nomor
// yang kosong. Format: OLT-001, OLT-002, dst
// ======================================================
const generateKodeOlt = async (): Promise<string> => {
  const olts = await prisma.olt.findMany({
    select: { kode_olt: true },
    orderBy: { kode_olt: "asc" },
  });

  const numbers = olts
    .map((o) => parseInt(o.kode_olt.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `OLT-${String(next).padStart(3, "0")}`;
};

// Ambil data OLT dengan search & pagination, untuk Table + Search + Pagination
export const getOlts = async (search: string = "", page: number = 1) => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge — modul baca data minimal wajib login

  const where = search
    ? {
        OR: [
          { kode_olt: { contains: search } },
          { nama_olt: { contains: search } },
          { lokasi: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.olt.findMany({
      where,
      include: { pop: true },
      orderBy: { kode_olt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.olt.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// Ambil daftar POP untuk dropdown Select pada Form Dialog
export const getPops = async () => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge

  return prisma.pop.findMany({
    select: {
      id_pop: true,
      nama_pop: true,
      alamat: true,
    },
    orderBy: { nama_pop: "asc" },
  });
};

// Buat data OLT baru (dipanggil dari Create Dialog)
export const createOlt = async (formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const kode_olt = await generateKodeOlt();
  const nama_olt = formData.get("nama_olt") as string;
  const lokasi = formData.get("lokasi") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const ip_olt = (formData.get("ip_olt") as string) || null;
  const username_olt = (formData.get("username_olt") as string) || null;
  const password_olt = (formData.get("password_olt") as string) || null;

  const fotoFile = formData.get("foto_olt") as File | null;
  const foto_olt =
    fotoFile && fotoFile.size > 0 ? await saveFotoOlt(fotoFile) : null;

  const olt = await prisma.olt.create({
    data: {
      kode_olt,
      nama_olt,
      lokasi,
      latitude,
      longitude,
      id_pop,
      ip_olt,
      username_olt,
      password_olt,
      foto_olt,
    },
  });

  // await logActivity("OLT_CREATED", `OLT ${olt.nama_olt} dibuat.`);

  revalidatePath("/masterdata/olt");
};

// Update data OLT (dipanggil dari Edit Dialog)
export const updateOlt = async (id: number, formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const nama_olt = formData.get("nama_olt") as string;
  const lokasi = formData.get("lokasi") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const ip_olt = (formData.get("ip_olt") as string) || null;
  const username_olt = (formData.get("username_olt") as string) || null;
  const password_olt = (formData.get("password_olt") as string) || null;

  const existing = await prisma.olt.findUnique({
    where: { id_olt: id },
    select: { foto_olt: true },
  });

  const fotoFile = formData.get("foto_olt") as File | null;
  let foto_olt = existing?.foto_olt ?? null;

  if (fotoFile && fotoFile.size > 0) {
    await deleteFotoOlt(existing?.foto_olt ?? null);
    foto_olt = await saveFotoOlt(fotoFile);
  }

  const olt = await prisma.olt.update({
    where: { id_olt: id },
    data: {
      nama_olt,
      lokasi,
      latitude,
      longitude,
      id_pop,
      ip_olt,
      username_olt,
      password_olt,
      foto_olt,
    },
  });

  // await logActivity("OLT_UPDATED", `OLT ${olt.nama_olt} diperbarui.`);

  revalidatePath("/masterdata/olt");
};

// Hapus data OLT (dipanggil dari Delete AlertDialog)
export const deleteOlt = async (id: number) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const olt = await prisma.olt.delete({ where: { id_olt: id } });

  await deleteFotoOlt(olt.foto_olt);

  // await logActivity("OLT_DELETED", `OLT ${olt.nama_olt} dihapus.`);

  revalidatePath("/masterdata/olt");
};