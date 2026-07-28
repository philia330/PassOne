"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { portpon_status } from "@prisma/client"; // ✅ Disesuaikan dengan enum di schema.prisma

const PAGE_SIZE = 10;

// Path halaman untuk revalidate cache Next.js
const PORT_PON_PATH = "/masterdata/port-pon";

// ======================================================
// Ambil data Port PON dengan search & pagination
// ======================================================
export const getPortPons = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { tipe_kartu: { contains: search } },
          { olt: { nama_olt: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.portPon.findMany({
      where,
      include: { olt: true, odp: true },
      orderBy: [{ id_olt: "asc" }, { nomor_port: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.portPon.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Dropdown OLT & ODP
// ======================================================
export const getOlts = async () => {
  return prisma.olt.findMany({
    select: { id_olt: true, nama_olt: true },
    orderBy: { nama_olt: "asc" },
  });
};

export const getOdps = async () => {
  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

// ======================================================
// Tambah Port PON
// ======================================================
export const createPortPon = async (formData: FormData) => {
  const nomor_port = parseInt(formData.get("nomor_port") as string, 10) || 0;
  const tipe_kartu = (formData.get("tipe_kartu") as string) || "";
  const status = (formData.get("status") as portpon_status) || "TERSEDIA"; // ✅ Menggunakan portpon_status
  const id_olt = parseInt(formData.get("id_olt") as string, 10);

  if (!id_olt) {
    throw new Error("OLT wajib dipilih");
  }

  // Konversi string kosong ("") menjadi null
  const id_odp_raw = formData.get("id_odp") as string;
  const id_odp =
    id_odp_raw && id_odp_raw.trim() !== "" ? parseInt(id_odp_raw, 10) : null;

  await prisma.portPon.create({
    data: { nomor_port, tipe_kartu, status, id_olt, id_odp },
  });

  revalidatePath(PORT_PON_PATH);
};

// ======================================================
// Update Port PON
// ======================================================
export const updatePortPon = async (id: number, formData: FormData) => {
  const nomor_port = parseInt(formData.get("nomor_port") as string, 10) || 0;
  const tipe_kartu = (formData.get("tipe_kartu") as string) || "";
  const status = (formData.get("status") as portpon_status) || "TERSEDIA"; // ✅ Menggunakan portpon_status
  const id_olt = parseInt(formData.get("id_olt") as string, 10);

  if (!id_olt) {
    throw new Error("OLT wajib dipilih");
  }

  // Konversi string kosong ("") menjadi null
  const id_odp_raw = formData.get("id_odp") as string;
  const id_odp =
    id_odp_raw && id_odp_raw.trim() !== "" ? parseInt(id_odp_raw, 10) : null;

  await prisma.portPon.update({
    where: { id_port: id },
    data: { nomor_port, tipe_kartu, status, id_olt, id_odp },
  });

  revalidatePath(PORT_PON_PATH);
};

// ======================================================
// Hapus Port PON
// ======================================================
export const deletePortPon = async (id: number) => {
  await prisma.portPon.delete({ where: { id_port: id } });
  revalidatePath(PORT_PON_PATH);
};