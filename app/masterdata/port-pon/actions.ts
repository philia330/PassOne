"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusPort } from "@prisma/client";

const PAGE_SIZE = 10;

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
  const nomor_port = parseInt(formData.get("nomor_port") as string, 10);
  const tipe_kartu = formData.get("tipe_kartu") as string;
  const status = formData.get("status") as StatusPort;
  const id_olt = parseInt(formData.get("id_olt") as string, 10);

  // Pastikan string kosong ("") terkonversi menjadi null, BUKAN NaN
  const id_odp_raw = formData.get("id_odp") as string;
  const id_odp =
    id_odp_raw && id_odp_raw.trim() !== "" ? parseInt(id_odp_raw, 10) : null;

  await prisma.portPon.create({
    data: { nomor_port, tipe_kartu, status, id_olt, id_odp },
  });

  revalidatePath("/masterdata/port-pon");
};

// ======================================================
// Update Port PON
// ======================================================
export const updatePortPon = async (id: number, formData: FormData) => {
  const nomor_port = parseInt(formData.get("nomor_port") as string, 10);
  const tipe_kartu = formData.get("tipe_kartu") as string;
  const status = formData.get("status") as StatusPort;
  const id_olt = parseInt(formData.get("id_olt") as string, 10);

  // Pastikan string kosong ("") terkonversi menjadi null, BUKAN NaN
  const id_odp_raw = formData.get("id_odp") as string;
  const id_odp =
    id_odp_raw && id_odp_raw.trim() !== "" ? parseInt(id_odp_raw, 10) : null;

  await prisma.portPon.update({
    where: { id_port: id }, // Sesuaikan dengan nama primary key di schema.prisma jika berbeda (misal: id_port_pon)
    data: { nomor_port, tipe_kartu, status, id_olt, id_odp },
  });

  revalidatePath("/masterdata/port-pon");
};

// ======================================================
// Hapus Port PON
// ======================================================
export const deletePortPon = async (id: number) => {
  await prisma.portPon.delete({ where: { id_port: id } });
  revalidatePath("/masterdata/port-pon");
};