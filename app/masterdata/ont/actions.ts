"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusOnt } from "@prisma/client";

const PAGE_SIZE = 10;

// ======================================================
// Ambil data ONT dengan search & pagination
// ======================================================
export const getOnts = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { serial_number: { contains: search } },
          { pelanggan: { contains: search } },
          { pop: { nama_pop: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.ont.findMany({
      where,
      include: { pop: true, odp: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ont.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Dropdown POP & ODP (select agar tidak bawa field Decimal)
// ======================================================
export const getPops = async () => {
  return prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true },
    orderBy: { nama_pop: "asc" },
  });
};

export const getOdps = async () => {
  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

// ======================================================
// Tambah ONT
// ======================================================
export const createOnt = async (formData: FormData) => {
  const serial_number = formData.get("serial_number") as string;
  const pelanggan = formData.get("pelanggan") as string;
  const status = formData.get("status") as StatusOnt;
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  await prisma.ont.create({
    data: { serial_number, pelanggan, status, id_pop, id_odp },
  });

  revalidatePath("/masterdata/ont");
};

// ======================================================
// Update ONT
// ======================================================
export const updateOnt = async (id: number, formData: FormData) => {
  const serial_number = formData.get("serial_number") as string;
  const pelanggan = formData.get("pelanggan") as string;
  const status = formData.get("status") as StatusOnt;
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  await prisma.ont.update({
    where: { id_ont: id },
    data: { serial_number, pelanggan, status, id_pop, id_odp },
  });

  revalidatePath("/masterdata/ont");
};

// ======================================================
// Hapus ONT
// ======================================================
export const deleteOnt = async (id: number) => {
  await prisma.ont.delete({ where: { id_ont: id } });
  revalidatePath("/masterdata/ont");
};